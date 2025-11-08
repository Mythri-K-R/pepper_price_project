# backend/weather_service.py

import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load the API key from our .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

ACCUWEATHER_API_KEY = os.getenv("ACCUWEATHER_API_KEY")

# The location keys you provided
LOCATION_KEYS = {
    "madikeri": "43287",
    "sirsi": "43225",
    "chikkamagaluru": "43260"
}

# --- [FIX #1] ---
# We are changing from "15day" to "5day", as this is the
# standard endpoint included in the Limited Trial.
FORECAST_URL = "http://dataservice.accuweather.com/forecasts/v1/daily/5day/"
# --- [END OF FIX #1] ---

def get_future_weather(region, target_date_str):
    """
    Fetches the 5-day weather forecast for a region.
    """
    
    if region not in LOCATION_KEYS:
        return {"error": "Invalid region"}
        
    if not ACCUWEATHER_API_KEY:
        return {"error": "AccuWeather API key not found. Check .env file."}

    location_key = LOCATION_KEYS[region]
    
    # Calculate how many days away the target date is
    try:
        target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}
        
    today = datetime.now().date()
    
    # --- [FIX #2] ---
    # We are reverting to the original authentication method,
    # putting the 'apikey' directly in the 'params' dictionary.
    params = {
        "apikey": ACCUWEATHER_API_KEY,
        "metric": "true"
    }
    
    api_url = f"{FORECAST_URL}{location_key}"
    
    try:
        # We no longer pass 'headers'
        response = requests.get(api_url, params=params)
        
    # --- [END OF FIX #2] ---
    
        response.raise_for_status() # Raise an error for bad responses
        forecast_data = response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"AccuWeather API Error: {e}")
        try:
            error_details = response.json()
            return {"error": f"AccuWeather API failed: {error_details.get('Message', 'Unknown error')}"}
        except:
             return {"error": f"AccuWeather API failed: {str(e)}"}
    except json.JSONDecodeError:
        return {"error": "Failed to decode AccuWeather response."}

    # --- Parse the Forecast ---
    forecasts_list = []
    
    if "DailyForecasts" not in forecast_data:
        return {"error": "No 'DailyForecasts' in API response."}

    for day_forecast in forecast_data["DailyForecasts"]:
        forecast_date = datetime.fromisoformat(day_forecast["Date"]).date()
        
        # Only add days that are in the future AND on or before the target date
        if forecast_date > today and forecast_date <= target_date:
            try:
                max_temp = day_forecast["Temperature"]["Maximum"]["Value"]
                min_temp = day_forecast["Temperature"]["Minimum"]["Value"]
                
                if "Rain" in day_forecast["Day"]:
                    rainfall = day_forecast["Day"]["Rain"]["Value"]
                elif "TotalLiquid" in day_forecast["Day"]:
                    rainfall = day_forecast["Day"]["TotalLiquid"]["Value"]
                else:
                    rainfall = 0.0
                    
                forecasts_list.append({
                    "Date": forecast_date.strftime('%Y-%m-%d'),
                    "Max_Temp": max_temp,
                    "Min_Temp": min_temp,
                    "Rainfall": rainfall
                })
            except KeyError as e:
                print(f"KeyError while parsing forecast: {e} on {forecast_date}")
                pass

    if not forecasts_list:
        return {"error": "Could not retrieve any valid future forecasts. (Note: Trial API is limited to 5 days)."}
        
    # Check if we have the forecast for the target date
    final_forecast_date = forecasts_list[-1]["Date"]
    if final_forecast_date != target_date_str:
        return {"error": f"Forecasts only available up to {final_forecast_date}. Target date {target_date_str} is too far."}

    return forecasts_list


if __name__ == "__main__":
    # --- This is just for testing ---
    # To test this file directly, install libraries and run:
    # python backend/weather_service.py
    
    print("Testing AccuWeather Service...")
    
    # Test for 3 days from now
    test_date = (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d')
    
    weather = get_future_weather("sirsi", test_date)
    
    print(f"Weather for Sirsi on {test_date}:")
    print(json.dumps(weather, indent=2))