# backend/gemini_service.py

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY not found in .env file.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# --- System Instruction ---
# This tells the model its persona and rules.
SYSTEM_INSTRUCTION = (
    "You are an expert AI assistant for a black pepper price prediction application. "
    "Your name is 'PepperBot'. "
    "You are helpful, polite, and an expert on all things related to black pepper (piper nigrum), "
    "especially in the context of Karnataka, India (regions like Sirsi, Madikeri, Chikkamagaluru). "
    "Answer questions about cultivation, market trends, history, and uses. "
    "If you are given specific data (like a price), use that data to answer the question. "
    "Keep your answers concise and informative."
)

try:
    # --- Model Configuration ---
    generation_config = {
      "temperature": 0.7,
      "top_p": 1,
      "top_k": 1,
      "max_output_tokens": 2048,
    }

    safety_settings = [
      {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
      {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
      {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
      {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    ]

    # Initialize the model
    model = genai.GenerativeModel(
        model_name="models/gemini-pro-latest",
        generation_config=generation_config,
        system_instruction=SYSTEM_INSTRUCTION,
        safety_settings=safety_settings
    )
    
    # We will use the same "chat" session for all requests
    chat_session = model.start_chat()
    print("Gemini chat session initialized successfully.")

except Exception as e:
    print(f"CRITICAL ERROR: Failed to initialize Gemini Model: {e}")
    print("Please ensure your GEMINI_API_KEY is correct and you have internet access.")
    model = None
    chat_session = None

def get_ai_response(user_prompt):
    """
    Sends a prompt to the Gemini chat session and gets a response.
    """
    if not chat_session:
        return "Error: The AI chat session is not initialized. Check the server logs and API key."

    try:
        response = chat_session.send_message(user_prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # This could be an API key issue, content safety block, etc.
        return f"Error communicating with the AI model: {e}"

if __name__ == "__main__":
    # --- This is just for testing ---
    # To test this file directly, run:
    # python backend/gemini_service.py
    
    print("Testing Gemini Service...")
    
    test_prompt_1 = "How do you grow black pepper?"
    print(f"User: {test_prompt_1}")
    response_1 = get_ai_response(test_prompt_1)
    print(f"PepperBot: {response_1}")

    print("-" * 20)

    test_prompt_2 = (
        "A user asked for the latest price in Sirsi. "
        "Our records show the latest price was ₹64,332 on 2025-09-30. "
        "Please formulate a helpful response."
    )
    print(f"User (Augmented): {test_prompt_2}")
    response_2 = get_ai_response(test_prompt_2)
    print(f"PepperBot: {response_2}")