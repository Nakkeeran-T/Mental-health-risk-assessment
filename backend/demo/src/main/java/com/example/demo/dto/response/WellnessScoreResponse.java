package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Composite Wellness Score DTO.
 * Combines three tracked dimensions into an overall wellness picture.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WellnessScoreResponse {

    /** Inverted risk score — higher = lower risk. Range 0-100. */
    private int riskScore;

    /** Average mood over the last 7 logged entries (scaled 0-100). */
    private int moodScore;

    /** Habit completion rate today (percentage 0-100). */
    private int habitScore;

    /** Journal engagement: entries in last 7 days (capped at 100). */
    private int journalScore;

    /** Overall composite wellness score (average of the four). */
    private int overallScore;

    /** Number of days since the last assessment (used for reminder logic). */
    private long daysSinceLastAssessment;

    /** Whether an assessment reminder should be shown (>7 days). */
    private boolean assessmentDue;
}
