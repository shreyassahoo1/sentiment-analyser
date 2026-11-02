import joblib
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from dataset import POSITIVE, NEGATIVE, NEUTRAL

# 1. Combine the data and attach a label to every sentence
texts = POSITIVE + NEGATIVE + NEUTRAL
labels = (["positive"] * len(POSITIVE)
          + ["negative"] * len(NEGATIVE)
          + ["neutral"] * len(NEUTRAL))

# 2. Split: 75% to learn from, 25% hidden to test the model fairly
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.25, random_state=42, stratify=labels
)

# 3. Pipeline = TF-IDF (text -> numbers) + Logistic Regression (the classifier)
model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
    ("clf", LogisticRegression(max_iter=1000)),
])

# 4. Train and evaluate on the unseen test data
model.fit(X_train, y_train)
predictions = model.predict(X_test)
print("Accuracy:", round(accuracy_score(y_test, predictions), 2))
print(classification_report(y_test, predictions))

# 5. Retrain on all the data and save the model to a file
model.fit(texts, labels)
joblib.dump(model, "model.joblib")
print("Model saved as model.joblib")

# 6. Quick try-out
for s in ["I love this so much", "This is the worst thing ever", "The train leaves at noon"]:
    print(s, "->", model.predict([s])[0])
