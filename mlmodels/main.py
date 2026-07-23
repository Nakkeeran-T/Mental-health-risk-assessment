"""
main.py — MindEase ML Microservice
------------------------------------
FastAPI application that exposes 3 ML endpoints called by the Spring Boot backend.

Endpoints:
    GET  /health              — liveness check
    POST /ml/risk-predict     — XGBoost mental health risk classification
    POST /ml/emotion-analyze  — NLP emotion detection (journal / chat)
    POST /ml/mood-forecast    — Linear regression mood trend prediction

Run:
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Interactive docs:
    http://localhost:8000/docs
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MindEase ML API",
    description=(
        "XGBoost-powered mental health risk assessment microservice.\n\n"
        "Algorithm: XGBoost Gradient Boosting Classifier (risk prediction) + "
        "HuggingFace Transformers (emotion analysis) + "
        "OLS Linear Regression (mood forecasting)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Request / Response Models ────────────────────────────────────────

class RiskPredictRequest(BaseModel):
    depression: int = Field(..., ge=0, le=27,  description="PHQ-9 total score (0–27)")
    anxiety:    int = Field(..., ge=0, le=21,  description="GAD-7 total score (0–21)")
    stress:     int = Field(..., ge=0, le=10,  description="Perceived stress level (0–10)")
    sleep_quality:     int = Field(..., ge=0, le=10, description="Sleep quality (0–10, higher = better)")
    social_engagement: int = Field(..., ge=0, le=10, description="Social engagement (0–10, higher = better)")
    appetite_level:    int = Field(..., ge=0, le=10, description="Appetite level (0–10, higher = better)")

    class Config:
        json_schema_extra = {
            "example": {
                "depression": 12, "anxiety": 8, "stress": 7,
                "sleep_quality": 4, "social_engagement": 5, "appetite_level": 5
            }
        }


class EmotionAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Journal entry or chat message text")

    class Config:
        json_schema_extra = {
            "example": {"text": "I've been feeling really hopeless and exhausted lately."}
        }


class MoodForecastRequest(BaseModel):
    scores: List[int] = Field(
        ..., min_length=1, max_length=30,
        description="Daily mood scores (1–5), ordered oldest to newest"
    )

    @field_validator("scores")
    @classmethod
    def validate_score_range(cls, v):
        for score in v:
            if not (1 <= score <= 5):
                raise ValueError("Each mood score must be between 1 and 5")
        return v

    class Config:
        json_schema_extra = {
            "example": {"scores": [4, 3, 3, 2, 3, 2, 1]}
        }


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    """Liveness check — returns service status."""
    return {
        "status": "ok",
        "service": "MindEase ML API",
        "version": "1.0.0",
        "algorithms": {
            "risk_classification": "XGBoost Gradient Boosting Classifier",
            "emotion_analysis":    "HuggingFace cardiffnlp/twitter-roberta-base-emotion (+ VADER fallback)",
            "mood_forecasting":    "OLS Linear Regression",
        },
    }


# ── Endpoint 1: XGBoost Risk Prediction ──────────────────────────────────────

@app.post(
    "/ml/risk-predict",
    tags=["Risk Assessment"],
    summary="Predict mental health risk level using XGBoost",
    response_description=(
        "Risk level (LOW/MODERATE/HIGH/CRITICAL), confidence score, "
        "all class probabilities, feature importances, and SHAP explanations."
    ),
)
def risk_predict(request: RiskPredictRequest):
    """
    **XGBoost Gradient Boosting Classifier**

    Predicts the mental health risk level from PHQ-9, GAD-7 and lifestyle signals.
    Returns confidence score and SHAP-based feature explanations showing which
    factor contributed most to the prediction.
    """
    try:
        from risk_classifier import predict_risk
        return predict_risk(
            request.depression,
            request.anxiety,
            request.stress,
            request.sleep_quality,
            request.social_engagement,
            request.appetite_level,
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Model not trained yet. Run: python train_risk_model.py  [{e}]"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction failed: {e}")


# ── Endpoint 2: NLP Emotion Analysis ─────────────────────────────────────────

@app.post(
    "/ml/emotion-analyze",
    tags=["Emotion Analysis"],
    summary="Detect emotion in text using NLP",
    response_description=(
        "Dominant emotion label, confidence score, all emotion scores, "
        "and which model was used (transformers or vader)."
    ),
)
def emotion_analyze(request: EmotionAnalyzeRequest):
    """
    **HuggingFace cardiffnlp/twitter-roberta-base-emotion**

    Detects the dominant emotion in journal text or chat messages.
    Emotions: joy, optimism, sadness, anger.
    Falls back to VADER sentiment analysis if the transformer model is unavailable.
    """
    try:
        from emotion_analyzer import analyze_emotion
        return analyze_emotion(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emotion analysis failed: {e}")


# ── Endpoint 3: Mood Trend Forecast ──────────────────────────────────────────

@app.post(
    "/ml/mood-forecast",
    tags=["Mood Forecasting"],
    summary="Forecast next-day mood using linear regression",
    response_description=(
        "Predicted mood score, trend (declining/stable/improving), "
        "OLS slope, alert flag, and human-readable message."
    ),
)
def mood_forecast(request: MoodForecastRequest):
    """
    **OLS Linear Regression (time-series)**

    Fits a regression line to the user's last 7 daily mood scores and
    predicts the next value.  Returns a trend label and an alert flag
    when the predicted mood drops below 2.5/5.
    """
    try:
        from mood_forecaster import forecast_mood
        return forecast_mood(request.scores)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mood forecast failed: {e}")
