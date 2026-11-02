import re
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = FastAPI(title="Sentiment & Tone Analyzer ML Service")

# Allow CORS so other tools or frontends can access if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load("model.joblib")      # our trained model
vader = SentimentIntensityAnalyzer()     # ready-made model

class TextIn(BaseModel):
    text: str

def classify(t):
    probs = model.predict_proba([t])[0]
    i = probs.argmax()
    return str(model.classes_[i]), round(float(probs[i]), 3)

@app.get("/")
def root():
    return {"status": "ok", "service": "ML Service on port 8000"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(body: TextIn):
    text = body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is empty")
    
    # Overall result for the whole paragraph
    overall, confidence = classify(text)
    
    # Result for each sentence
    parts = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    sentences = []
    for s in parts:
        label, conf = classify(s)
        sentences.append({"text": s, "sentiment": label, "confidence": conf})
    
    # Ready-made VADER model, for comparison
    score = round(float(vader.polarity_scores(text)["compound"]), 4)   # -1 to +1
    if score >= 0.05:
        vader_label = "positive"
    elif score <= -0.05:
        vader_label = "negative"
    else:
        vader_label = "neutral"
        
    return {
        "overallSentiment": overall,
        "confidence": confidence,
        "sentences": sentences,
        "vaderScore": score,
        "vaderLabel": vader_label,
    }
