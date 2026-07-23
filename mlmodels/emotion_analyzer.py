"""
emotion_analyzer.py
--------------------
NLP-based emotion detection for journal entries and chat messages.

Primary  : HuggingFace cardiffnlp/twitter-roberta-base-emotion
           (detects: joy, optimism, anger, sadness)
Fallback : VADER sentiment analysis (lightweight, no download required)

The HuggingFace model is downloaded on first use (~500 MB).
If unavailable (no internet / install issue), VADER is used silently.
"""

from typing import Dict, Any

_pipeline = None          # HuggingFace pipeline (lazy-loaded)
_vader_sia = None         # VADER SentimentIntensityAnalyzer (lazy-loaded)
_transformer_failed = False  # set True if HuggingFace load failed

HF_MODEL = "cardiffnlp/twitter-roberta-base-emotion"


# ── HuggingFace Loader ────────────────────────────────────────────────────────

def _load_hf_pipeline():
    """Attempt to load the HuggingFace emotion pipeline once."""
    global _pipeline, _transformer_failed
    if _transformer_failed:
        return None
    if _pipeline is not None:
        return _pipeline
    try:
        from transformers import pipeline as hf_pipeline
        _pipeline = hf_pipeline(
            "text-classification",
            model=HF_MODEL,
            return_all_scores=True,
            truncation=True,
            max_length=512,
        )
        print(f"[EmotionAnalyzer] Loaded HuggingFace model: {HF_MODEL}")
        return _pipeline
    except Exception as e:
        print(f"[EmotionAnalyzer] HuggingFace model unavailable: {e}. Using VADER fallback.")
        _transformer_failed = True
        return None


# ── VADER Loader ──────────────────────────────────────────────────────────────

def _load_vader():
    """Load VADER sentiment analyser (fallback)."""
    global _vader_sia
    if _vader_sia is not None:
        return _vader_sia
    try:
        import nltk
        nltk.download("vader_lexicon", quiet=True)
        from nltk.sentiment import SentimentIntensityAnalyzer
        _vader_sia = SentimentIntensityAnalyzer()
        return _vader_sia
    except Exception as e:
        print(f"[EmotionAnalyzer] VADER load failed: {e}")
        return None


# ── VADER Fallback ────────────────────────────────────────────────────────────

def _vader_analyze(text: str) -> Dict[str, Any]:
    """Map VADER compound score to an emotion label."""
    sia = _load_vader()
    if sia is None:
        return {"emotion": "neutral", "confidence": 0.5, "all_scores": {}, "source": "default"}

    scores = sia.polarity_scores(text)
    compound = scores["compound"]

    if compound >= 0.3:
        emotion, confidence = "joy", round(compound, 4)
    elif compound >= 0.05:
        emotion, confidence = "optimism", round(compound, 4)
    elif compound <= -0.5:
        emotion, confidence = "sadness", round(abs(compound), 4)
    elif compound <= -0.1:
        emotion, confidence = "anger", round(abs(compound), 4)
    else:
        emotion, confidence = "neutral", 0.5

    return {
        "emotion": emotion,
        "confidence": confidence,
        "all_scores": {k: round(v, 4) for k, v in scores.items()},
        "source": "vader",
    }


# ── Public API ────────────────────────────────────────────────────────────────

def analyze_emotion(text: str) -> Dict[str, Any]:
    """
    Detect the dominant emotion in the given text.

    Args:
        text: Journal entry content or chat message (any length).

    Returns:
        dict with keys:
            emotion    — dominant emotion label (str)
            confidence — probability / score (float 0–1)
            all_scores — scores for all detected emotions (dict)
            source     — "transformers" | "vader" | "default"
    """
    if not text or not text.strip():
        return {"emotion": "neutral", "confidence": 1.0, "all_scores": {}, "source": "default"}

    # Try HuggingFace first
    pipeline = _load_hf_pipeline()
    if pipeline is not None:
        try:
            results = pipeline(text[:512])[0]            # list of {label, score}
            sorted_results = sorted(results, key=lambda x: x["score"], reverse=True)
            top = sorted_results[0]
            return {
                "emotion": top["label"].lower(),
                "confidence": round(float(top["score"]), 4),
                "all_scores": {
                    r["label"].lower(): round(float(r["score"]), 4)
                    for r in sorted_results
                },
                "source": "transformers",
            }
        except Exception as e:
            print(f"[EmotionAnalyzer] Inference error: {e}. Falling back to VADER.")

    # VADER fallback
    return _vader_analyze(text)
