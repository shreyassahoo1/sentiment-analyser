# Full-Stack AI/ML Sentiment & Tone Analyzer

## Architecture
React :5173 → Express :5000 → FastAPI ML :8000
                    ↓
              MongoDB :27017 (sentimentdb)

## Project Files
- ml-service/dataset.py       — 90 labeled training sentences for training purposes
- ml-service/train.py         — TF-IDF + Logistic Regression trainer
- ml-service/app.py           — FastAPI /predict & /health endpoints
- ml-service/model.joblib     — Saved trained model
- server/models/Analysis.js   — Mongoose schema
- server/routes/analysisRoutes.js — REST endpoints
- server/server.js            — Express entry point (Step 4.5)
- client/src/App.jsx          — React main component
- client/src/App.css          — Glassmorphic dark UI
- client/vite.config.js       — Proxy /api → Express:5000

## Run Instructions

### Terminal 1 – Python ML Service
cd sentiment-analyzer/ml-service
source .venv/bin/activate
python train.py              # Once only
uvicorn app:app --reload --port 8000

### Terminal 2 – Express Backend
cd sentiment-analyzer/server
npm run dev

### Terminal 3 – React Client
cd sentiment-analyzer/client
npm run dev
# Open http://127.0.0.1:5173

## API Reference

### FastAPI (port 8000)
GET  /health   → {"status":"ok"}
POST /predict  → {overallSentiment, confidence, sentences[], vaderScore, vaderLabel}

### Express (port 5000)
POST   /api/analyses               → 201 + saved record
GET    /api/analyses               → 50 newest records
GET    /api/analyses/stats/summary → {positive, negative, neutral}
GET    /api/analyses/:id           → single record
DELETE /api/analyses/:id           → {"message":"Deleted"}
