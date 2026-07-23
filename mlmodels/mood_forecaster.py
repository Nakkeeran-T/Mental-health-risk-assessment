"""
mood_forecaster.py
------------------
Time-series mood prediction using linear regression over the last 7 days.

Input  : List of daily mood scores (1–5), most recent last.
Output : Predicted next-day mood score, trend direction, alert flag.

Algorithm:
    Fits a simple Ordinary Least Squares (OLS) line to the last N scores
    (up to 7) and extrapolates one step ahead.  No external libraries
    required — uses only NumPy for performance.
"""

import numpy as np
from typing import List, Dict, Any

# Trend thresholds
_DECLINING_SLOPE = -0.10   # slope below this → "declining"
_IMPROVING_SLOPE = +0.10   # slope above this → "improving"
_ALERT_SCORE     = 2.5     # predicted score ≤ this → alert = True
_ALERT_ON_DECLINE = True   # also alert when trend is "declining"


def forecast_mood(scores: List[int]) -> Dict[str, Any]:
    """
    Predict the next mood score and characterise the recent trend.

    Args:
        scores: List of daily mood scores (integers 1–5).
                Expects at least 1 value; up to 7 are used.

    Returns:
        dict with keys:
            predicted_score  — float (1.0–5.0, clamped)
            trend            — "declining" | "stable" | "improving"
            slope            — float  (OLS slope)
            alert            — bool   (True when score is low or trend declining)
            data_points_used — int    (how many scores were used)
            message          — human-readable summary
    """
    if not scores:
        return _build_result(3.0, "stable", 0.0, False, 0, "No data available.")

    # Use at most the last 7 entries
    n = min(len(scores), 7)
    recent = [float(s) for s in scores[-n:]]

    if n == 1:
        pred = recent[0]
        return _build_result(pred, "stable", 0.0, pred <= _ALERT_SCORE, 1,
                             f"Only 1 data point — no trend computable.")

    # OLS linear regression: y = slope * x + intercept
    x = np.arange(n, dtype=float)
    y = np.array(recent, dtype=float)

    x_mean, y_mean = x.mean(), y.mean()
    denom = ((x - x_mean) ** 2).sum()
    slope = float(((x - x_mean) * (y - y_mean)).sum() / denom) if denom != 0 else 0.0
    intercept = y_mean - slope * x_mean

    # Predict x = n (one step beyond the last value)
    predicted = float(slope * n + intercept)
    predicted = round(max(1.0, min(5.0, predicted)), 2)

    # Classify trend
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

    return _build_result(predicted, trend, round(slope, 4), alert, n, msg)


def _build_result(predicted: float, trend: str, slope: float,
                  alert: bool, n: int, message: str) -> Dict[str, Any]:
    return {
        "predicted_score":  predicted,
        "trend":            trend,
        "slope":            slope,
        "alert":            alert,
        "data_points_used": n,
        "message":          message,
    }
