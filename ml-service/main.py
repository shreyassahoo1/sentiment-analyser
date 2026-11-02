import re
import os
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = FastAPI(
    title="Sentiment & Tone Analysis Microservice",
    description="Full-stack AI/ML microservice using scikit-learn TF-IDF + Logistic Regression and VADER second opinion",
    version="1.0.0"
)

# Enable CORS for frontend and Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize VADER sentiment analyzer
vader_analyzer = SentimentIntensityAnalyzer()

# Load trained custom scikit-learn model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.joblib")
model = None

def get_model():
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
        else:
            raise RuntimeError(f"Model file not found at {MODEL_PATH}. Run train.py first.")
    return model


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Input text/paragraph to analyze")


def split_into_sentences(text: str) -> list[str]:
    """Splits text into meaningful sentences."""
    # Split on periods, exclamation marks, question marks, and newlines
    raw_sentences = re.split(r'(?<=[.!?\n])\s+', text.strip())
    sentences = [s.strip() for s in raw_sentences if s.strip()]
    if not sentences:
        sentences = [text.strip()]
    return sentences


def get_custom_sentiment(clf, text_to_analyze: str):
    """Generates custom ML prediction and confidence score."""
    classes = list(clf.classes_)
    probs = clf.predict_proba([text_to_analyze])[0]
    best_idx = probs.argmax()
    predicted_label = str(classes[best_idx])
    confidence = float(probs[best_idx])
    
    probabilities = {
        str(cls): round(float(prob), 4)
        for cls, prob in zip(classes, probs)
    }
    return predicted_label, round(confidence, 4), probabilities


def get_vader_opinion(text_to_analyze: str):
    """Calculates VADER sentiment score and categorical label."""
    scores = vader_analyzer.polarity_scores(text_to_analyze)
    compound = scores["compound"]
    
    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
        
    return {
        "sentiment": sentiment,
        "compound": round(compound, 4),
        "scores": {
            "pos": round(scores["pos"], 4),
            "neu": round(scores["neu"], 4),
            "neg": round(scores["neg"], 4),
        }
    }


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Python FastAPI Sentiment & Tone Analyzer",
        "port": 8000,
        "model_loaded": os.path.exists(MODEL_PATH)
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model_exists": os.path.exists(MODEL_PATH)
    }


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    clf = get_model()
    
    # 1. Overall Custom ML prediction
    overall_sentiment, overall_conf, overall_probs = get_custom_sentiment(clf, text)
    
    # 2. Overall VADER Second Opinion
    overall_vader = get_vader_opinion(text)
    
    # 3. Sentence-by-Sentence Breakdown
    sentences = split_into_sentences(text)
    sentence_breakdown = []
    
    for sentence in sentences:
        s_sentiment, s_conf, s_probs = get_custom_sentiment(clf, sentence)
        s_vader = get_vader_opinion(sentence)
        sentence_breakdown.append({
            "sentence": sentence,
            "sentiment": s_sentiment,
            "confidence": s_conf,
            "probabilities": s_probs,
            "vader": s_vader
        })
        
    return {
        "text": text,
        "overall": {
            "sentiment": overall_sentiment,
            "confidence": overall_conf,
            "probabilities": overall_probs
        },
        "vader": overall_vader,
        "sentences": sentence_breakdown,
        "total_sentences": len(sentence_breakdown)
    }


@app.post("/predict")
def predict_simple(req: AnalyzeRequest):
    """Simplified endpoint for single prediction"""
    clf = get_model()
    sentiment, conf, probs = get_custom_sentiment(clf, req.text)
    return {
        "text": req.text,
        "sentiment": sentiment,
        "confidence": conf,
        "probabilities": probs
    }
