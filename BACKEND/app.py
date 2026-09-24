from flask import Flask, request, jsonify, render_template
import pickle
import os
from newspaper import Article
import requests

app = Flask(__name__)

# ── Load Model & Vectorizer ───────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "fake_news_model.pkl")
VEC_PATH = os.path.join(BASE_DIR, "tfidf_vectorizer.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

with open(VEC_PATH, "rb") as f:
    vectorizer = pickle.load(f)
def extract_news(url):

    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    response = requests.get(url, headers=headers)

    article = Article(url)

    article.set_html(response.text)

    article.parse()

    return article.text

# ── Routes ────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()

        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field"}), 400

        text = data['text'].lower().strip()
        transformed = vectorizer.transform([text])
        prediction = int(model.predict(transformed)[0])
        probability = model.predict_proba(transformed)[0]

        result = "REAL NEWS" if prediction == 0 else "FAKE NEWS"
        confidence = round(float(probability[1]) * 100, 2) if prediction == 1 else round(float(probability[0]) * 100, 2)

        return jsonify({
            "prediction": result,
            "raw_prediction": prediction,
            "confidence": confidence,
            "fake_prob": round(float(probability[1]) * 100, 2),
            "real_prob": round(float(probability[0]) * 100, 2)
            
        })
    except Exception as e:

        import traceback
        traceback.print_exc()

        return jsonify({"error": str(e)}), 500



@app.route('/predict_url', methods=['POST'])
def predict_url():
    try:

        data = request.get_json()

        if not data or 'url' not in data:
            return jsonify({"error": "Missing URL"}), 400

        url = data['url']

        news_text = extract_news(url)

        transformed = vectorizer.transform([news_text])

        prediction = int(model.predict(transformed)[0])

        probability = model.predict_proba(transformed)[0]

        result = "REAL NEWS" if prediction == 0 else "FAKE NEWS"

        confidence = (
            round(float(probability[0]) * 100, 2)
            if prediction == 0
            else round(float(probability[1]) * 100, 2)
        )

        return jsonify({
            "prediction": result,
            "confidence": confidence,
            "news_text": news_text[:500]
        })
    except Exception as e:

        import traceback
        traceback.print_exc()

        return jsonify({"error": str(e)}), 500

    

if __name__ == "__main__":
    app.run(debug=True)   
