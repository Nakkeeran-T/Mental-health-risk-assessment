package com.example.demo.service;

import com.example.demo.entity.Answer;
import com.example.demo.enums.RiskLevel;
import com.example.demo.service.MlService.MlRiskResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Risk Assessment Engine
 *
 * Primary path  : XGBoost ML model (via MlService → Python FastAPI microservice).
 *                 Returns risk level + confidence + SHAP feature explanations.
 *
 * Fallback path : PHQ-9 / GAD-7 / Stress rule-based thresholds.
 *                 Used automatically when the ML service is unavailable.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RiskAssessmentEngine {

    private final MlService mlService;

    // ── ML-enhanced assessment result ──────────────────────────────────────────

    /**
     * Result of a full risk assessment — includes whether ML was used.
     */
    public record RiskAssessmentResult(
            RiskLevel riskLevel,
            Double mlConfidence,   // null when fallback (rule-based) was used
            boolean usedMl
    ) {}

    // ── Primary: XGBoost ML Prediction ────────────────────────────────────────

    /**
     * Predicts overall risk from all 6 clinical signals via XGBoost.
     * Falls back to rule-based logic if ML service is unreachable.
     *
     * @param depressionScore  PHQ-9 total (0–27)
     * @param anxietyScore     GAD-7 total (0–21)
     * @param stressLevel      Stress level (0–10)
     * @param sleepQuality     Sleep quality (0–10)
     * @param socialEngagement Social engagement (0–10)
     * @param appetiteLevel    Appetite level (0–10)
     */
    public RiskAssessmentResult predictWithMl(int depressionScore, int anxietyScore,
                                              int stressLevel, int sleepQuality,
                                              int socialEngagement, int appetiteLevel) {
        // 1. Try XGBoost via ML microservice
        MlRiskResult mlResult = mlService.predictRisk(
                depressionScore, anxietyScore, stressLevel,
                sleepQuality, socialEngagement, appetiteLevel
        );

        if (mlResult != null && mlResult.riskLevel() != null) {
            RiskLevel level = toRiskLevel(mlResult.riskLevel());
            log.info("[RiskEngine] XGBoost → {} (confidence: {:.0%})", level, mlResult.confidence());
            return new RiskAssessmentResult(level, mlResult.confidence(), true);
        }

        // 2. Fallback: rule-based scoring
        log.info("[RiskEngine] ML unavailable — using rule-based fallback.");
        RiskLevel fallback = ruleBasedFromScores(depressionScore, anxietyScore, stressLevel);
        return new RiskAssessmentResult(fallback, null, false);
    }

    // ── PHQ-9 (Depression) ────────────────────────────────────────────────────

    /**
     * PHQ-9 (Patient Health Questionnaire-9) scoring for Depression.
     * Scores range from 0-27.
     * 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-19: Moderately Severe, 20-27: Severe.
     */
    public RiskLevel calculatePhq9Score(List<Answer> answers) {
        if (answers == null || answers.isEmpty()) return null;
        int score = calculateTotalScore(answers);
        if (score <= 4)  return RiskLevel.LOW;
        if (score <= 9)  return RiskLevel.MODERATE;
        if (score <= 14) return RiskLevel.MODERATE;
        if (score <= 19) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    // ── GAD-7 (Anxiety) ───────────────────────────────────────────────────────

    /**
     * GAD-7 (Generalized Anxiety Disorder-7) scoring for Anxiety.
     * Scores range from 0-21.
     * 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-21: Severe.
     */
    public RiskLevel calculateGad7Score(List<Answer> answers) {
        if (answers == null || answers.isEmpty()) return null;
        int score = calculateTotalScore(answers);
        if (score <= 4)  return RiskLevel.LOW;
        if (score <= 9)  return RiskLevel.MODERATE;
        if (score <= 14) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    // ── Stress Scale ──────────────────────────────────────────────────────────

    /**
     * Generic Stress Scale scoring (percentage-based).
     */
    public RiskLevel calculateStressScore(List<Answer> answers) {
        if (answers == null || answers.isEmpty()) return null;
        int score = calculateTotalScore(answers);
        int maxPossibleScore = calculateMaxPossibleScore(answers);
        if (maxPossibleScore == 0) return RiskLevel.LOW;

        double percentage = ((double) score / maxPossibleScore) * 100;
        if (percentage <= 25) return RiskLevel.LOW;
        if (percentage <= 50) return RiskLevel.MODERATE;
        if (percentage <= 75) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    // ── Overall Risk (for answer-based assessments) ────────────────────────────

    /**
     * Determines the overall risk level by taking the highest risk level
     * among the specific scales (Depression, Anxiety, Stress).
     */
    public RiskLevel determineOverallRiskLevel(RiskLevel depressionRisk,
                                               RiskLevel anxietyRisk,
                                               RiskLevel stressRisk) {
        RiskLevel highest = RiskLevel.LOW;
        highest = getHighestRisk(highest, depressionRisk);
        highest = getHighestRisk(highest, anxietyRisk);
        highest = getHighestRisk(highest, stressRisk);
        return highest;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private RiskLevel ruleBasedFromScores(int depression, int anxiety, int stress) {
        RiskLevel d = calculatePhq9ScoreFromInt(depression);
        RiskLevel a = calculateGad7ScoreFromInt(anxiety);
        RiskLevel s = stressIntToRisk(stress);
        return determineOverallRiskLevel(d, a, s);
    }

    private RiskLevel calculatePhq9ScoreFromInt(int score) {
        if (score <= 4)  return RiskLevel.LOW;
        if (score <= 9)  return RiskLevel.MODERATE;
        if (score <= 14) return RiskLevel.MODERATE;
        if (score <= 19) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private RiskLevel calculateGad7ScoreFromInt(int score) {
        if (score <= 4)  return RiskLevel.LOW;
        if (score <= 9)  return RiskLevel.MODERATE;
        if (score <= 14) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private RiskLevel stressIntToRisk(int stress) {
        if (stress <= 3) return RiskLevel.LOW;
        if (stress <= 6) return RiskLevel.MODERATE;
        if (stress <= 8) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private RiskLevel toRiskLevel(String label) {
        try { return RiskLevel.valueOf(label.toUpperCase()); }
        catch (Exception e) { return RiskLevel.MODERATE; }
    }

    private RiskLevel getHighestRisk(RiskLevel currentHighest, RiskLevel newRisk) {
        if (newRisk == null) return currentHighest;
        if (newRisk == RiskLevel.CRITICAL) return RiskLevel.CRITICAL;
        if (newRisk == RiskLevel.HIGH && currentHighest != RiskLevel.CRITICAL) return RiskLevel.HIGH;
        if (newRisk == RiskLevel.MODERATE && currentHighest == RiskLevel.LOW) return RiskLevel.MODERATE;
        return currentHighest;
    }

    @SuppressWarnings("null")
    private int calculateTotalScore(List<Answer> answers) {
        return answers.stream().mapToInt(Answer::getScore).sum();
    }

    private int calculateMaxPossibleScore(List<Answer> answers) {
        return answers.stream().mapToInt(a -> a.getQuestion().getMaxScore()).sum();
    }
}
