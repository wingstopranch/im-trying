from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file
api_key = os.getenv("OPENAI_API_KEY")

# Test to ensure it works
if not api_key:
    raise ValueError("API key not found. Please check your .env file.")
