package com.example.demo.service;

import com.example.demo.entity.Answer;
import com.example.demo.enums.RiskLevel;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Risk Assessment Engine
 * Handles scoring and risk level determination for specific psychological scales.
 */
@Component
public class RiskAssessmentEngine {

    /**
     * PHQ-9 (Patient Health Questionnaire-9) scoring for Depression.
     * Scores range from 0-27.
     * 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-19: Moderately Severe, 20-27: Severe.
     */
    public RiskLevel calculatePhq9Score(List<Answer> answers) {
        if (answers == null || answers.isEmpty()) return null;
        
        int score = calculateTotalScore(answers);
        
        if (score <= 4) return RiskLevel.LOW;       // Minimal
        if (score <= 9) return RiskLevel.MODERATE;  // Mild
        if (score <= 14) return RiskLevel.MODERATE; // Moderate
        if (score <= 19) return RiskLevel.HIGH;     // Moderately Severe
        return RiskLevel.CRITICAL;                  // Severe (20-27)
    }

    /**
     * GAD-7 (Generalized Anxiety Disorder-7) scoring for Anxiety.
     * Scores range from 0-21.
     * 0-4: Minimal, 5-9: Mild, 10-14: Moderate, 15-21: Severe.
     */
    public RiskLevel calculateGad7Score(List<Answer> answers) {
        if (answers == null || answers.isEmpty()) return null;

        int score = calculateTotalScore(answers);

        if (score <= 4) return RiskLevel.LOW;       // Minimal
        if (score <= 9) return RiskLevel.MODERATE;  // Mild
        if (score <= 14) return RiskLevel.HIGH;     // Moderate
        return RiskLevel.CRITICAL;                  // Severe (15-21)
    }

    /**
     * Generic Stress Scale scoring.
     * Assumes a generic scale mapping to our internal RiskLevels.
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

    /**
     * Determines the overall risk level by taking the highest risk level
     * among the specific scales (Depression, Anxiety, Stress).
     */
    public RiskLevel determineOverallRiskLevel(RiskLevel depressionRisk, RiskLevel anxietyRisk, RiskLevel stressRisk) {
        RiskLevel highest = RiskLevel.LOW;
        
        highest = getHighestRisk(highest, depressionRisk);
        highest = getHighestRisk(highest, anxietyRisk);
        highest = getHighestRisk(highest, stressRisk);
        
        return highest;
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
