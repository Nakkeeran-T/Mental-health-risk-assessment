"""
train_risk_model.py
-------------------
Generates synthetic clinical training data based on PHQ-9 / GAD-7 / stress
scoring thresholds and trains an XGBoost classifier for mental health risk
level prediction.

Run once before starting the FastAPI server:
    python train_risk_model.py

Outputs:
    xgb_risk_model.pkl  — saved XGBoost model
    Accuracy + classification report printed to console
    Feature importance printed to console
"""

import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# ── Risk level labels ─────────────────────────────────────────────────────────
# 0 = LOW | 1 = MODERATE | 2 = HIGH | 3 = CRITICAL
RISK_LABELS = {0: "LOW", 1: "MODERATE", 2: "HIGH", 3: "CRITICAL"}
MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgb_risk_model.pkl")

np.random.seed(42)


def generate_samples(n, dep_range, anx_range, stress_range,
                     sleep_range, social_range, appetite_range, label):
    """Generate n synthetic samples for a given risk class."""
    return {
        "depression":        np.random.randint(dep_range[0],     dep_range[1] + 1,     n),
        "anxiety":           np.random.randint(anx_range[0],     anx_range[1] + 1,     n),
        "stress":            np.random.randint(stress_range[0],  stress_range[1] + 1,  n),
        "sleep_quality":     np.random.randint(sleep_range[0],   sleep_range[1] + 1,   n),
        "social_engagement": np.random.randint(social_range[0],  social_range[1] + 1,  n),
        "appetite_level":    np.random.randint(appetite_range[0],appetite_range[1] + 1,n),
        "risk_level":        [label] * n,
    }


def build_dataset():
    """
    Build a balanced synthetic dataset grounded in clinical PHQ-9 / GAD-7 cutoffs.

    PHQ-9 cutoffs:  0-4 minimal | 5-9 mild | 10-14 moderate | 15-19 mod-severe | 20-27 severe
    GAD-7 cutoffs:  0-4 minimal | 5-9 mild | 10-14 moderate  | 15-21 severe
    """
    low      = generate_samples(900, (0,4),   (0,4),   (0,3),  (7,10), (7,10), (7,10), 0)
    moderate = generate_samples(700, (5,14),  (5,9),   (4,6),  (5,7),  (5,7),  (5,7),  1)
    high     = generate_samples(500, (10,19), (10,14), (7,8),  (3,5),  (3,5),  (3,5),  2)
    critical = generate_samples(300, (20,27), (15,21), (9,10), (0,3),  (0,3),  (0,3),  3)

    # Add some overlap / noise to make the task realistic
    noisy = generate_samples(200, (5,19), (5,14), (3,8), (3,8), (3,8), (3,8), 1)

    all_data = {}
    for key in low:
        all_data[key] = np.concatenate([
            low[key], moderate[key], high[key], critical[key], noisy[key]
        ])

    return pd.DataFrame(all_data)


def train():
    print("=" * 60)
    print("  MindEase - XGBoost Risk Classifier Training")
    print("=" * 60)

    df = build_dataset()
    print(f"\nDataset size : {len(df)} samples")
    print(f"Class distribution:\n{df['risk_level'].value_counts().sort_index()}")

    X = df.drop("risk_level", axis=1)
    y = df["risk_level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="multi:softprob",
        num_class=4,
        eval_metric="mlogloss",
        random_state=42,
        verbosity=0,
    )

    print("\nTraining XGBoost classifier...")
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)

    print(f"\nTest Accuracy : {acc:.4f} ({acc*100:.2f}%)")
    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["LOW", "MODERATE", "HIGH", "CRITICAL"]
    ))

    # Feature importance
    feature_names = X.columns.tolist()
    importances = model.feature_importances_
    print("Feature Importances:")
    for name, imp in sorted(zip(feature_names, importances), key=lambda x: -x[1]):
        bar = "#" * int(imp * 40)
        print(f"  {name:<20} {bar} {imp:.4f}")

    joblib.dump(model, MODEL_PATH)
    print(f"\n[OK] Model saved -> {MODEL_PATH}")
    print("=" * 60)


if __name__ == "__main__":
    train()
