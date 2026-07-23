package com.example.demo.enums;

/**
 * AssessmentSource — identifies how an assessment was generated.
 *
 * MANUAL   : User completed the PHQ-9 / GAD-7 / Stress questionnaire directly.
 * AI_CHAT  : Assessment was derived from an AI chatbot conversation session.
 */
public enum AssessmentSource {
    MANUAL,
    AI_CHAT
}
