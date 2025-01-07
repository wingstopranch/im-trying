from flask import Flask, request, jsonify
import openai
import os

app = Flask(__name__)

# Load OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route("/process-pdfs", methods=["POST"])
def process_pdfs():
    inclusion_keywords = request.form.get("inclusionKeywords", "").split(",")
    exclusion_keywords = request.form.get("exclusionKeywords", "").split(",")
    files = request.files.getlist("files")

    results = []

    for file in files:
        try:
            content = file.read().decode("utf-8")
            is_relevant = analyze_relevance(content, inclusion_keywords, exclusion_keywords)
            message = f"{file.filename} - Relevant" if is_relevant else f"{file.filename} - Not Relevant"
            results.append({"file": file.filename, "message": message, "isRelevant": is_relevant})
        except Exception as e:
            results.append({"file": file.filename, "message": f"Error processing file: {str(e)}", "isRelevant": False})

    return jsonify(results)

def analyze_relevance(content, inclusion_keywords, exclusion_keywords):
    prompt = f"Analyze the following content for relevance:\n\n{content}\n\n"
    prompt += f"Inclusion Keywords: {', '.join(inclusion_keywords)}\n"
    prompt += f"Exclusion Keywords: {', '.join(exclusion_keywords)}\n"

    try:
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=500,
            n=1,
            stop=None,
            temperature=0.5,
        )
        return "relevant" in response.choices[0].text.lower()
    except Exception as e:
        print(f"Error calling OpenAI API: {str(e)}")
        return False

if __name__ == "__main__":
    app.run(debug=True)