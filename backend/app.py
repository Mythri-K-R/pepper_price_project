# backend/app.py

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import dateparser
import pandas as pd

# --- [UPDATED IMPORTS] ---
from weather_service import get_future_weather
from prediction_service import (
    make_prediction, 
    get_latest_prices, 
    get_historical_data,
    backtest_model,  # <-- [NEW] Import the backtest function
    HISTORICAL_DATA
)
from gemini_service import get_ai_response

# Initialize the Flask app
app = Flask(__name__)

# --- [UPDATED CORS] ---
frontend_url_1 = "http://localhost:8080"
frontend_url_2 = "http://localhost:5173"
CORS(app, resources={r"/*": {"origins": [frontend_url_1, frontend_url_2]}})
# --- [END OF UPDATE] ---


# --- 1. Health Check Route ---
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "Backend server is running!"})


# --- 2. Prediction Route ---
@app.route('/predict', methods=['POST'])
def handle_prediction():
    # (This function is unchanged)
    data = request.get_json()
    if not data: return jsonify({"error": "No JSON data provided"}), 400
    region = data.get('region')
    target_date = data.get('date')
    if not region or not target_date: return jsonify({"error": "Missing 'region' or 'date' in JSON"}), 400
    print(f"Received prediction request: Region={region}, Date={target_date}")
    weather_forecasts = get_future_weather(region, target_date)
    if isinstance(weather_forecasts, dict) and 'error' in weather_forecasts:
        print(f"Weather Service Error: {weather_forecasts['error']}")
        return jsonify(weather_forecasts), 400
    if not weather_forecasts:
        err_msg = "No weather forecasts were returned, cannot predict."
        print(err_msg)
        return jsonify({"error": err_msg}), 500
    predicted_price, error = make_prediction(region, weather_forecasts)
    if error:
        print(f"Prediction Service Error: {error}")
        return jsonify({"error": error}), 500
    print(f"Prediction successful. Price: {predicted_price}")
    return jsonify({"region": region, "target_date": target_date, "predicted_price": predicted_price})


# --- 3. Chatbot Route ---
@app.route('/chat', methods=['POST'])
def handle_chat():
    # (This function is unchanged)
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "No 'message' provided"}), 400
        
    user_message = data['message'].strip()
    augmented_prompt = user_message
    
    if "price" in user_message.lower() or "rate" in user_message.lower():
        region = None
        if "sirsi" in user_message.lower(): region = "sirsi"
        elif "madikeri" in user_message.lower(): region = "madikeri"
        elif "chikkamagaluru" in user_message.lower(): region = "chikkamagaluru"
        
        if region:
            specific_date_found = False
            parsed_date = dateparser.parse(user_message, settings={'PREFER_DATES_FROM': 'past'})
            
            if parsed_date:
                try:
                    date_str = parsed_date.strftime('%Y-%m-%d')
                    if date_str in HISTORICAL_DATA[region].index:
                        specific_data = HISTORICAL_DATA[region].loc[date_str]
                        if isinstance(specific_data, pd.DataFrame):
                            specific_price = specific_data.iloc[0]['Price']
                        else: 
                            specific_price = specific_data['Price']
                        augmented_prompt = (
                            f"A user is asking about the price in {region} for a specific date: {date_str}. "
                            f"My internal records show the price on that day was ₹{specific_price:,.2f}. "
                            f"Please answer their question using this exact data. The user's original "
                            f"question was: '{user_message}'"
                        )
                        specific_date_found = True
                        print(f"Augmented prompt with SPECIFIC date {date_str} for {region}.")
                    else:
                        print(f"Date {date_str} not found in {region} records.")
                        specific_date_found = False
                except Exception as e:
                    print(f"Error during specific date RAG: {e}")
                    specific_date_found = False
            
            if not specific_date_found:
                try:
                    latest_data = HISTORICAL_DATA[region].iloc[-1]
                    latest_price = latest_data['Price']
                    latest_date = latest_data.name.strftime('%Y-%m-%d')
                    augmented_prompt = (
                        f"A user is asking about the price in {region}. They might have asked "
                        f"for a specific date that I couldn't find in my records (e.g., '{user_message}'). "
                        f"Instead, please provide the LATEST available price. "
                        f"My internal records show the latest price was ₹{latest_price:,.2f} on {latest_date}. "
                        f"Please answer their question, and *politely* mention that you are providing the *latest* price "
                        f"because the specific date they asked for was not found."
                    )
                    print(f"Augmented prompt with LATEST date for {region} (fallback).")
                except Exception as e:
                    print(f"Error during fallback RAG augmentation: {e}")
                    augmented_prompt = user_message
        
    ai_response = get_ai_response(augmented_prompt)
    return jsonify({"response": ai_response})


# --- 4. Latest Prices Route ---
@app.route('/latest-prices', methods=['GET'])
def handle_latest_prices():
    # (This function is unchanged)
    print("Received request for /latest-prices")
    prices = get_latest_prices()
    return jsonify(prices)


# --- 5. Historical Data Route ---
@app.route('/historical-data', methods=['GET'])
def handle_historical_data():
    # (This function is unchanged)
    region = request.args.get('region')
    days_str = request.args.get('days')
    if not region or not days_str: return jsonify({"error": "Missing 'region' or 'days' parameter"}), 400
    try:
        days = int(days_str)
    except ValueError:
        return jsonify({"error": "'days' must be an integer"}), 400
    print(f"Received request for /historical-data: Region={region}, Days={days}")
    data, error = get_historical_data(region, days)
    if error: return jsonify({"error": error}), 500
    return jsonify(data)


# --- 6. [NEW] Model Backtest Route ---
@app.route('/model-backtest', methods=['GET'])
def handle_model_backtest():
    """
    Gets the Actual vs. Predicted data for Dashboard Tab 2.
    Expects query parameters: /model-backtest?region=sirsi&days=90
    """
    region = request.args.get('region')
    days_str = request.args.get('days')
    
    if not region or not days_str:
        return jsonify({"error": "Missing 'region' or 'days' parameter"}), 400
        
    try:
        days = int(days_str)
    except ValueError:
        return jsonify({"error": "'days' must be an integer"}), 400
        
    print(f"Received request for /model-backtest: Region={region}, Days={days}")
    
    data, error = backtest_model(region, days)
    
    if error:
        return jsonify({"error": error}), 500
        
    return jsonify(data)


# --- Run the server ---
if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)