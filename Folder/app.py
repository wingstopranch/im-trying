# app.py
from flask import Flask, request, jsonify
import openai
import os

# Set up OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask app
app = Flask(__name__)

# Endpoint to interact with OpenAI's GPT-4
@app.route("/ask-ai", methods=["POST"])
def ask_ai():
    # Get the prompt from the frontend request
    prompt = request.json.get("prompt")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        # Send request to OpenAI API (ChatGPT-4)
        response = openai.Completion.create(
            model="gpt-4",
            prompt=prompt,
            max_tokens=150
        )

        # Extract the response text from OpenAI's API
        chat_response = response.choices[0].text.strip()

        return jsonify({"message": chat_response})
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "Error interacting with OpenAI API"}), 500


# Run the Flask app
if __name__ == "__main__":
    app.run(debug=True)
