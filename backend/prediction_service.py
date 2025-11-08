# backend/prediction_service.py

import os
import pickle
import numpy as np
import pandas as pd
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler # We need this for the new function

# --- Configuration ---
MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

WINDOW_SIZE = 60

# --- Load all models and scalers into memory ---
print("Loading all models and scalers...")
MODELS = {}
SCALERS = {}
HISTORICAL_DATA = {}

regions = ["madikeri", "sirsi", "chikkamagaluru"]
features = ['Max_Temp', 'Min_Temp', 'Rainfall', 'Price']

for region in regions:
    try:
        model_path = os.path.join(MODELS_DIR, f"{region}_lstm.h5")
        MODELS[region] = load_model(model_path)
        
        scaler_path = os.path.join(MODELS_DIR, f"{region}_scaler.pkl")
        with open(scaler_path, 'rb') as f:
            SCALERS[region] = pickle.load(f)
            
        data_path = os.path.join(DATA_DIR, f"{region}_merged.csv")
        df = pd.read_csv(data_path, parse_dates=['Date'], index_col='Date')
        HISTORICAL_DATA[region] = df[features]
        
        print(f"Successfully loaded artifacts for {region}")
        
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to load artifacts for {region}: {e}")

print("All artifacts loaded.")


def make_prediction(region, future_weather_forecasts):
    # (This function is unchanged)
    
    if region not in MODELS:
        return None, f"No model loaded for region: {region}"
        
    model = MODELS[region]
    scaler = SCALERS[region]
    historical_df = HISTORICAL_DATA[region]
    
    try:
        last_window_df = historical_df.tail(WINDOW_SIZE)
        last_window_scaled = scaler.transform(last_window_df)
    except Exception as e:
        return None, f"Error scaling historical data: {e}"
        
    current_input = np.array([last_window_scaled])
    predicted_price_scaled = 0.0
    
    for i, day_forecast in enumerate(future_weather_forecasts):
        predicted_price_scaled = model.predict(current_input, verbose=0)[0][0]
        new_row_weather = [day_forecast['Max_Temp'], day_forecast['Min_Temp'], day_forecast['Rainfall']]
        dummy_row = new_row_weather + [0.0] 
        scaled_dummy_row = scaler.transform([dummy_row])[0]
        scaled_dummy_row[3] = predicted_price_scaled
        new_input_window = current_input[0][1:] 
        new_row_reshaped = np.expand_dims(scaled_dummy_row, axis=0)
        current_input = np.vstack([new_input_window, new_row_reshaped])
        current_input = np.expand_dims(current_input, axis=0)

    final_dummy_row = [0, 0, 0, predicted_price_scaled]
    unscaled_dummy_row = scaler.inverse_transform([final_dummy_row])
    final_predicted_price = unscaled_dummy_row[0, 3]
    
    return float(final_predicted_price), None

def get_latest_prices():
    # (This function is unchanged)
    latest_prices = {}
    for region, df in HISTORICAL_DATA.items():
        try:
            latest_record = df.iloc[-1]
            latest_prices[region] = {
                "price": latest_record['Price'],
                "date": latest_record.name.strftime('%Y-%m-%d')
            }
        except Exception as e:
            print(f"Error getting latest price for {region}: {e}")
            latest_prices[region] = None
    return latest_prices

def get_historical_data(region, days):
    # (This function is unchanged)
    if region not in HISTORICAL_DATA:
        return None, "Invalid region"
    try:
        historical_df = HISTORICAL_DATA[region].tail(days)
        price_data = historical_df[['Price']]
        price_data = price_data.reset_index()
        price_data['Date'] = price_data['Date'].dt.strftime('%Y-%m-%d')
        return price_data.to_dict('records'), None
    except Exception as e:
        print(f"Error getting historical data for {region}: {e}")
        return None, str(e)


# --- [NEW FUNCTION FOR DASHBOARD TAB 2] ---
def backtest_model(region, days_to_backtest):
    """
    Runs the saved model over historical data to compare
    Actual vs. Predicted prices.
    """
    if region not in MODELS:
        return None, f"No model loaded for region: {region}"
        
    try:
        # 1. Get the required model, scaler, and data
        model = MODELS[region]
        scaler = SCALERS[region]
        # We need all data, including the window, so we grab extra
        data_df = HISTORICAL_DATA[region].tail(days_to_backtest + WINDOW_SIZE)
        
        # 2. Scale all data
        scaled_data = scaler.transform(data_df)
        
        # 3. Create the historical X and y windows
        X_hist = []
        y_hist_scaled = [] # These are the actual scaled prices
        
        for i in range(WINDOW_SIZE, len(scaled_data)):
            X_hist.append(scaled_data[i-WINDOW_SIZE:i])
            y_hist_scaled.append(scaled_data[i, 3]) # Index 3 is 'Price'
            
        X_hist = np.array(X_hist)
        y_hist_scaled = np.array(y_hist_scaled)
        
        # 4. Get the model's predictions
        y_pred_scaled = model.predict(X_hist, verbose=0)
        
        # 5. We must "inverse transform" both the actual and predicted prices
        # We create dummy arrays, as the scaler expects all 4 features
        
        # Create dummy array for actual prices
        dummy_actual = np.zeros((len(y_hist_scaled), 4))
        dummy_actual[:, 3] = y_hist_scaled.ravel()
        actual_prices = scaler.inverse_transform(dummy_actual)[:, 3]
        
        # Create dummy array for predicted prices
        dummy_pred = np.zeros((len(y_pred_scaled), 4))
        dummy_pred[:, 3] = y_pred_scaled.ravel()
        predicted_prices = scaler.inverse_transform(dummy_pred)[:, 3]
        
        # 6. Get the dates for the X-axis
        dates = data_df.index[WINDOW_SIZE:].strftime('%Y-%m-%d')
        
        # 7. Format for frontend
        # e.g., [{"date": "2025-09-30", "actual": 100, "predicted": 102}, ...]
        results = []
        for i in range(len(dates)):
            results.append({
                "date": dates[i],
                "actual": actual_prices[i],
                "predicted": predicted_prices[i]
            })
            
        return results, None

    except Exception as e:
        print(f"Error during model backtest for {region}: {e}")
        import traceback
        traceback.print_exc()
        return None, str(e)