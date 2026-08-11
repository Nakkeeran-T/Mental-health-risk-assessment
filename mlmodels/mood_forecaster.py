"""
mood_forecaster.py
------------------
Time-series mood forecasting ensemble combining OLS Linear Regression
and Holt's Double Exponential Smoothing (Holt's Linear Trend Model).

Input  : List of daily mood scores (1–5), most recent last.
Output : Predicted next-day mood score, trend direction, alert flag, ensemble breakdown.
"""

import numpy as np
from typing import List, Dict, Any, Optional

# Trend thresholds
_DECLINING_SLOPE = -0.10   # slope below this → "declining"
_IMPROVING_SLOPE = +0.10   # slope above this → "improving"
_ALERT_SCORE     = 2.5     # predicted score ≤ this → alert = True
_ALERT_ON_DECLINE = True   # also alert when trend is "declining"


def _holt_linear_exponential_smoothing(recent: List[float], alpha: float = 0.6, beta: float = 0.3) -> float:
    """
    Calculate Holt's Double Exponential Smoothing one-step-ahead forecast.
    Assigns exponentially higher weight to recent daily mood scores.
    """
    n = len(recent)
    if n == 1:
        return recent[0]

    # Initialise level (L0) and trend (T0)
    L = recent[0]
    T = recent[1] - recent[0]

    for i in range(1, n):
        y_i = recent[i]
        L_prev = L
        L = alpha * y_i + (1 - alpha) * (L_prev + T)
        T = beta * (L - L_prev) + (1 - beta) * T

    # 1-step forecast: F(n+1) = L_n + T_n
    forecast = L + T
    return float(forecast)


def forecast_mood(scores: List[int]) -> Dict[str, Any]:
    """
    Predict the next mood score using an ensemble of OLS Linear Regression 
    and Holt's Double Exponential Smoothing.
    """
    if not scores:
        return _build_result(3.0, "stable", 0.0, False, 0, "No data available.", {})

    # Use at most the last 7 entries
    n = min(len(scores), 7)
    recent = [float(s) for s in scores[-n:]]

    if n == 1:
        pred = recent[0]
        return _build_result(
            pred, "stable", 0.0, pred <= _ALERT_SCORE, 1,
            "Only 1 data point — no trend computable.",
            {"ols_predicted": pred, "holt_predicted": pred}
        )

    # 1. OLS Linear Regression: y = slope * x + intercept
    x = np.arange(n, dtype=float)
    y = np.array(recent, dtype=float)

    x_mean, y_mean = x.mean(), y.mean()
    denom = ((x - x_mean) ** 2).sum()
    slope = float(((x - x_mean) * (y - y_mean)).sum() / denom) if denom != 0 else 0.0
    intercept = y_mean - slope * x_mean

    ols_pred = float(slope * n + intercept)

    # 2. Holt's Double Exponential Smoothing Forecast
    holt_pred = _holt_linear_exponential_smoothing(recent, alpha=0.6, beta=0.3)

    # 3. Ensemble Blend (50% OLS Trajectory + 50% Holt Adaptive Momentum)
    ensemble_pred = 0.5 * ols_pred + 0.5 * holt_pred
    predicted = round(max(1.0, min(5.0, ensemble_pred)), 2)

    # Classify trend based on OLS slope & exponential momentum
    if slope < _DECLINING_SLOPE:
        trend = "declining"
    elif slope > _IMPROVING_SLOPE:
        trend = "improving"
    else:
        trend = "stable"

    alert = predicted <= _ALERT_SCORE or (_ALERT_ON_DECLINE and trend == "declining")

    # Human-readable message
    if trend == "declining":
        msg = f"Mood appears to be declining (predicted: {predicted}/5). Consider checking in."
    elif trend == "improving":
        msg = f"Mood is improving! Predicted score: {predicted}/5. Keep it up."
    else:
        msg = f"Mood is relatively stable. Predicted score: {predicted}/5."

    algorithm_details = {
        "ols_predicted": round(ols_pred, 2),
        "holt_exponential_predicted": round(holt_pred, 2),
        "ensemble_blend": "50% OLS Linear Regression + 50% Holt Double Exponential Smoothing"
    }

    return _build_result(predicted, trend, round(slope, 4), alert, n, msg, algorithm_details)


def _build_result(predicted: float, trend: str, slope: float,
                  alert: bool, n: int, message: str,
                  algorithm_details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return {
        "predicted_score":  predicted,
        "trend":            trend,
        "slope":            slope,
        "alert":            alert,
        "data_points_used": n,
        "message":          message,
        "forecasting_model": algorithm_details or {}
    }
