import time
from typing import Optional
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from imblearn.over_sampling import SMOTE
import joblib
import os

# ── Risk level labels ─────────────────────────────────────────────────────────
# 0 = LOW | 1 = MODERATE | 2 = HIGH | 3 = CRITICAL
RISK_LABELS = {0: "LOW", 1: "MODERATE", 2: "HIGH", 3: "CRITICAL"}
MODEL_PATH = os.path.join(os.path.dirname(__file__), "xgb_risk_model.pkl")
DEFAULT_DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset", "Mental Health Dataset.csv")

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


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add domain-specific engineered composite risk signals."""
    df_copy = df.copy()
    df_copy["isolation_index"] = (10 - df_copy["sleep_quality"]) + (10 - df_copy["social_engagement"])
    df_copy["occupational_stress"] = df_copy["stress"] * (10 - df_copy["appetite_level"])
    df_copy["family_clinical_risk"] = df_copy["depression"] * df_copy["anxiety"]
    return df_copy


def build_synthetic_dataset():
    """
    Build a balanced synthetic dataset grounded in clinical PHQ-9 / GAD-7 cutoffs.
    """
    low      = generate_samples(900, (0,4),   (0,4),   (0,3),  (7,10), (7,10), (7,10), 0)
    moderate = generate_samples(700, (5,14),  (5,9),   (4,6),  (5,7),  (5,7),  (5,7),  1)
    high     = generate_samples(500, (10,19), (10,14), (7,8),  (3,5),  (3,5),  (3,5),  2)
    critical = generate_samples(300, (20,27), (15,21), (9,10), (0,3),  (0,3),  (0,3),  3)

    noisy = generate_samples(200, (5,19), (5,14), (3,8), (3,8), (3,8), (3,8), 1)

    all_data = {}
    for key in low:
        all_data[key] = np.concatenate([
            low[key], moderate[key], high[key], critical[key], noisy[key]
        ])

    df = pd.DataFrame(all_data)
    return add_engineered_features(df)


def load_and_preprocess_real_dataset(csv_path: str) -> pd.DataFrame:
    """
    Load real Mental Health survey CSV and map responses into clinical feature columns.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Real dataset CSV not found at: {csv_path}")

    df = pd.read_csv(csv_path, low_memory=False)
    df['self_employed'] = df['self_employed'].fillna('No')

    dep_score = (
        df['Mental_Health_History'].map({'Yes': 10, 'Maybe': 5, 'No': 1}) +
        df['Changes_Habits'].map({'Yes': 7, 'Maybe': 4, 'No': 0}) +
        df['Work_Interest'].map({'No': 6, 'Maybe': 3, 'Yes': 0}) +
        df['treatment'].map({'Yes': 4, 'No': 0})
    ).fillna(0).clip(0, 27).astype(int)

    anx_score = (
        df['Coping_Struggles'].map({'Yes': 9, 'No': 1}) +
        df['mental_health_interview'].map({'No': 6, 'Maybe': 3, 'Yes': 0}) +
        df['family_history'].map({'Yes': 6, 'No': 0})
    ).fillna(0).clip(0, 21).astype(int)

    stress_score = (
        df['Growing_Stress'].map({'Yes': 5, 'Maybe': 3, 'No': 1}) +
        df['Mood_Swings'].map({'High': 5, 'Medium': 3, 'Low': 0})
    ).fillna(0).clip(0, 10).astype(int)

    sleep_score = df['Days_Indoors'].map({
        'Go out Every day': 9, '1-14 days': 7, '15-30 days': 5,
        '31-60 days': 3, 'More than 2 months': 1
    }).fillna(5).astype(int)

    social_score = df['Social_Weakness'].map({
        'No': 9, 'Maybe': 5, 'Yes': 2
    }).fillna(5).astype(int)

    appetite_score = df['Changes_Habits'].map({
        'No': 9, 'Maybe': 5, 'Yes': 2
    }).fillna(5).astype(int)

    risk_levels = []
    for d, a, s in zip(dep_score, anx_score, stress_score):
        if d >= 20 or a >= 15 or s >= 9:
            risk_levels.append(3)  # CRITICAL
        elif d >= 10 or a >= 10 or s >= 7:
            risk_levels.append(2)  # HIGH
        elif d >= 5 or a >= 5 or s >= 4:
            risk_levels.append(1)  # MODERATE
        else:
            risk_levels.append(0)  # LOW

    base_df = pd.DataFrame({
        "depression": dep_score,
        "anxiety": anx_score,
        "stress": stress_score,
        "sleep_quality": sleep_score,
        "social_engagement": social_score,
        "appetite_level": appetite_score,
        "risk_level": risk_levels
    })

    return add_engineered_features(base_df)


def train_model(dataset_path: Optional[str] = None, use_real_data: bool = True) -> dict:
    """
    Train Calibrated Soft Voting Ensemble (XGBoost + RandomForest) with SMOTE oversampling.
    """
    start_time = time.time()
    print("=" * 60)
    print("  MindEase - Advanced Calibrated Ensemble Classifier Retraining")
    print("=" * 60)

    target_csv = dataset_path or DEFAULT_DATASET_PATH
    if use_real_data and os.path.exists(target_csv):
        print(f"Loading real dataset from: {target_csv}")
        df = load_and_preprocess_real_dataset(target_csv)
        dataset_source = "real_dataset"
    else:
        print("Using synthetic dataset generator...")
        df = build_synthetic_dataset()
        dataset_source = "synthetic_data"

    print(f"\nDataset size : {len(df)} samples")
    print(f"Class distribution:\n{df['risk_level'].value_counts().sort_index()}")

    X = df.drop("risk_level", axis=1)
    y = df["risk_level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nApplying SMOTE class balancing...")
    smote = SMOTE(random_state=42)
    res = smote.fit_resample(X_train, y_train)
    X_train_res, y_train_res = res[0], res[1]
    print(f"Balanced training size: {len(X_train_res)} samples")

    print("\nTraining Calibrated Voting Ensemble (XGBoost + RandomForest)...")
    xgb = XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        verbosity=0,
        n_jobs=-1
    )

    rf = RandomForestClassifier(
        n_estimators=50,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )

    ensemble = VotingClassifier(
        estimators=[('xgb', xgb), ('rf', rf)],
        voting='soft'
    )

    calibrated_model = CalibratedClassifierCV(
        estimator=ensemble,
        method='sigmoid',
        cv=3
    )

    calibrated_model.fit(X_train_res, y_train_res)

    y_pred = calibrated_model.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    report_str = classification_report(
        y_test, y_pred,
        target_names=["LOW", "MODERATE", "HIGH", "CRITICAL"]
    )
    report_dict = classification_report(
        y_test, y_pred,
        target_names=["LOW", "MODERATE", "HIGH", "CRITICAL"],
        output_dict=True
    )
    cm = confusion_matrix(y_test, y_pred)

    duration = round(time.time() - start_time, 2)
    print(f"\nTest Accuracy : {acc:.4f} ({acc*100:.2f}%)")
    print(f"Training Time : {duration} seconds")
    print("\n" + "=" * 60)
    print("CLASSIFICATION REPORT (Precision, Recall, F1-Score per class):")
    print("=" * 60)
    print(report_str)
    print("CONFUSION MATRIX:")
    print(cm)
    print("=" * 60)

    joblib.dump(calibrated_model, MODEL_PATH)
    print(f"\n[OK] Calibrated Ensemble Model saved -> {MODEL_PATH}")
    print("=" * 60)

    return {
        "status": "success",
        "dataset_source": dataset_source,
        "total_samples": len(df),
        "balanced_samples": len(X_train_res),
        "accuracy": round(acc, 4),
        "training_time_seconds": duration,
        "model_path": MODEL_PATH,
        "classification_report": report_dict
    }


if __name__ == "__main__":
    train_model()


