import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load the API key from the .env file
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Create a basic model instance (using gemini-2.5-flash which is great for fast text and code)
model = genai.GenerativeModel('gemini-2.5-flash')

def start():
    print("Welcome to openzess - Step 0 (Gemini Version)!")
    user_input = input("Say hello to your AI: ")
    
    # Generate content using Gemini
    prompt = f"System: You are openzess, a brand new AI assistant. Be brief and friendly.\nUser: {user_input}"
    
    try:
        response = model.generate_content(prompt)
        print(f"\nopenzess: {response.text}")
    except Exception as e:
        print(f"\nError: {e}")
        print("Please make sure you have added your GEMINI_API_KEY to the .env file.")

if __name__ == "__main__":
    start()
