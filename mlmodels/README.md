# MindEase ML Microservice

Python FastAPI microservice providing XGBoost + Random Forest Calibrated Ensemble mental health risk assessment, real-time online model retraining, instant model evaluation, NLP emotion analysis, and mood trend forecasting.

## Prerequisites

- Python 3.9+ (Python 3.12+ recommended)
- Spring Boot backend running on port 8080

## Setup & Execution

```bash
cd mlmodels

# 1. Install dependencies
pip install -r requirements.txt

# 2. Train the Calibrated Ensemble Model (XGBoost + Random Forest + SMOTE)
python train_risk_model.py

# 3. Evaluate the trained model (Instant Accuracy & Confusion Matrix)
python evaluate_model.py

# 4. Start the FastAPI ML microservice
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

| Method | Endpoint | Algorithm | Purpose |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| POST | `/ml/risk-predict` | **XGBoost + Random Forest Ensemble** | Risk level classification & SHAP explanations |
| POST | `/ml/retrain` | **SMOTE Ensemble Retrainer** | Real-time model retraining & hot-reload |
| POST | `/ml/emotion-analyze` | **HuggingFace NLP** | Emotion detection |
| POST | `/ml/mood-forecast` | **Linear Regression** | Mood trend prediction |

Interactive Swagger Docs: **http://localhost:8000/docs**

## Features & Architecture

- **Calibrated Ensemble Model**: Combines **XGBoost** and **Random Forest** soft-voting classifiers wrapped in `CalibratedClassifierCV` (Sigmoid calibration) for smooth risk probability scores.
- **SMOTE Class Balancing**: Handles dataset class imbalance, generating balanced training vectors (528,972 samples).
- **Composite Feature Engineering**: Computes domain signals (`isolation_index`, `occupational_stress`, `family_clinical_risk`).
- **Explainable AI (SHAP)**: Computes local Shapley values to explain which feature contributed most to each user's risk rating.
- **Instant Model Evaluator**: Run `python evaluate_model.py` to get full test set accuracy, per-class F1-scores, and confusion matrix in under 2 seconds.
