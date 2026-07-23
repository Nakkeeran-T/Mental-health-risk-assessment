# MindEase ML Microservice

Python FastAPI microservice providing XGBoost-powered mental health risk assessment,
NLP emotion analysis, and mood trend forecasting.

## Prerequisites

- Python 3.9+ (you have 3.12.10 ✅)
- The Spring Boot backend running on port 8080

## Setup

```bash
cd mlmodels

# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the XGBoost model (run once — takes ~10 seconds)
python train_risk_model.py

# 3. Start the ML microservice
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

| Method | Endpoint | Algorithm | Purpose |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| POST | `/ml/risk-predict` | **XGBoost** | Risk level classification |
| POST | `/ml/emotion-analyze` | **HuggingFace NLP** | Emotion detection |
| POST | `/ml/mood-forecast` | **Linear Regression** | Mood trend prediction |

Interactive docs: **http://localhost:8000/docs**

## Example Requests

### Risk Prediction (XGBoost)
```json
POST /ml/risk-predict
{
  "depression": 14,
  "anxiety": 10,
  "stress": 7,
  "sleep_quality": 4,
  "social_engagement": 4,
  "appetite_level": 5
}
```
Response:
```json
{
  "risk_level": "HIGH",
  "confidence": 0.8914,
  "all_probabilities": {"LOW": 0.02, "MODERATE": 0.06, "HIGH": 0.89, "CRITICAL": 0.03},
  "feature_importance": {"depression": 0.42, "anxiety": 0.28, "sleep_quality": 0.14, ...},
  "shap_values": {"depression": 0.31, "sleep_quality": -0.18, ...}
}
```

### Emotion Analysis (NLP)
```json
POST /ml/emotion-analyze
{
  "text": "I've been feeling really hopeless and exhausted lately."
}
```
Response:
```json
{
  "emotion": "sadness",
  "confidence": 0.8762,
  "all_scores": {"sadness": 0.8762, "anger": 0.07, "optimism": 0.03, "joy": 0.02},
  "source": "transformers"
}
```

### Mood Forecast (Linear Regression)
```json
POST /ml/mood-forecast
{
  "scores": [4, 3, 3, 2, 3, 2, 1]
}
```
Response:
```json
{
  "predicted_score": 1.7,
  "trend": "declining",
  "slope": -0.3214,
  "alert": true,
  "data_points_used": 7,
  "message": "Mood appears to be declining (predicted: 1.7/5). Consider checking in."
}
```

## Architecture

```
Spring Boot (port 8080)
        │
        │  HTTP POST (via MlService.java)
        ▼
Python FastAPI (port 8000)
   ├── /ml/risk-predict     → xgb_risk_model.pkl (XGBoost)
   ├── /ml/emotion-analyze  → HuggingFace Transformers + VADER fallback
   └── /ml/mood-forecast    → OLS Linear Regression (NumPy)
```

## Notes

- The HuggingFace emotion model (~500MB) is downloaded on first use
- If HuggingFace is unavailable, VADER sentiment analysis is used as fallback
- The XGBoost model must be trained before starting the server (`python train_risk_model.py`)
- Spring Boot calls this service with a 3-second timeout; rule-based scoring is used as fallback if this service is down
