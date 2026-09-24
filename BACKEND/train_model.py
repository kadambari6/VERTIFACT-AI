import pandas as pd
import re
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

# ── Load WELFake only ──
df = pd.read_csv("WELFake_Dataset.csv")

# ── Text ──
df["text"] = df["title"].fillna("") + " " + df["text"].fillna("")

# ── Clean ──
def clean(text):
    text = str(text).lower()
    text = re.sub(r"http\S+", "", text)
    text = re.sub(r"[^a-zA-Z ]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

df["text"] = df["text"].apply(clean)
df = df[df["text"].str.len() > 50]
df = df[["text", "label"]].dropna()

print(df["label"].value_counts())

# ── Split ──
X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"],
    test_size=0.2, random_state=42, stratify=df["label"]
)

# ── TF-IDF ──
vectorizer = TfidfVectorizer(
    max_features=50000,
    ngram_range=(1, 3),
    stop_words="english",
    sublinear_tf=True,
    min_df=2
)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# ── Model ──
model = LogisticRegression(
    max_iter=1000,
    C=2.0,
    solver='lbfgs',
    class_weight='balanced'
)
model.fit(X_train_vec, y_train)

# ── Evaluate ──
y_pred = model.predict(X_test_vec)
print(f"Accuracy: {accuracy_score(y_test, y_pred) * 100:.2f}%")
print(classification_report(y_test, y_pred))

# ── Save ──
pickle.dump(model, open("fake_news_model.pkl", "wb"))
pickle.dump(vectorizer, open("tfidf_vectorizer.pkl", "wb"))
print("Model saved successfully!")
