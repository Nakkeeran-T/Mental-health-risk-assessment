import os
import time
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from train_risk_model import load_and_preprocess_real_dataset, DEFAULT_DATASET_PATH, MODEL_PATH, RISK_LABELS

def evaluate_saved_model(dataset_path: str = DEFAULT_DATASET_PATH, model_path: str = MODEL_PATH):
    print("=" * 65)
    print("  MindEase Risk Model - Instant Performance & Accuracy Evaluator")
    print("=" * 65)

    if not os.path.exists(model_path):
        print(f"[ERROR] Trained model file not found at: {model_path}")
        return

    if not os.path.exists(dataset_path):
        print(f"[ERROR] Dataset file not found at: {dataset_path}")
        return

    print(f"Loading dataset from : {dataset_path}")
    df = load_and_preprocess_real_dataset(dataset_path)

    X = df.drop("risk_level", axis=1)
    y = df["risk_level"]

    # Use exact same split & random state as training
    from sklearn.model_selection import train_test_split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Loading model binary : {model_path}")
    start_eval = time.time()
    model = joblib.load(model_path)
    
    # Run evaluation on hold-out test set
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)
    eval_time = round(time.time() - start_eval, 4)

    acc = float(accuracy_score(y_test, y_pred))
    report_text = classification_report(
        y_test, y_pred,
        target_names=["LOW (0)", "MODERATE (1)", "HIGH (2)", "CRITICAL (3)"],
        digits=4
    )
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 65)
    print(f"  OVERALL TEST ACCURACY : {acc:.4f} ({acc*100:.2f}%)")
    print(f"  EVALUATION LATENCY    : {eval_time} seconds ({len(X_test)} test samples)")
    print("=" * 65)

    print("\n[1] CLASSIFICATION REPORT (Precision, Recall, F1-Score per Class):")
    print("-" * 65)
    print(report_text)

    print("[2] CONFUSION MATRIX (Actual rows vs Predicted columns):")
    print("-" * 65)
    header = f"{'Actual \\ Pred':<15} | {'LOW (0)':<10} | {'MODERATE (1)':<12} | {'HIGH (2)':<10} | {'CRITICAL (3)':<12}"
    print(header)
    print("-" * len(header))
    class_names = ["LOW (0)", "MODERATE (1)", "HIGH (2)", "CRITICAL (3)"]
    for i, row in enumerate(cm):
        row_str = " | ".join(f"{count:<10}" if idx != 1 and idx != 3 else f"{count:<12}" for idx, count in enumerate(row))
        print(f"{class_names[i]:<15} | {row_str}")

    print("\n[3] SAMPLE REAL TEST PREDICTIONS WITH CALIBRATED PROBABILITIES:")
    print("-" * 65)
    sample_df = X_test.head(5).copy()
    sample_preds = y_pred[:5]
    sample_probas = y_proba[:5]
    sample_trues = y_test.iloc[:5].values

    for idx in range(5):
        pred_label = RISK_LABELS.get(sample_preds[idx], "UNKNOWN")
        true_label = RISK_LABELS.get(sample_trues[idx], "UNKNOWN")
        probs_str = ", ".join([f"{RISK_LABELS[c]}: {sample_probas[idx][c]*100:.1f}%" for c in range(4)])
        print(f"Sample #{idx+1}: Actual = {true_label:<8} | Predicted = {pred_label:<8} | Probas -> [{probs_str}]")

    print("\n" + "=" * 65)


if __name__ == "__main__":
    evaluate_saved_model()
