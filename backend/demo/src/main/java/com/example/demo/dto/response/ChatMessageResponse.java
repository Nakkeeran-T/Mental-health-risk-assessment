package com.example.demo.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a single chat turn.
 * Contains the bot reply, running mental health signals, and flags.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessageResponse {

    /** The AI-generated bot reply shown to the user. */
    private String botMessage;

    /** Extracted mental health signals accumulated over the conversation. */
    private MentalHealthSignals signals;

    /**
     * Whether the chatbot has gathered enough signals to produce
     * a meaningful assessment (typically after 8+ exchanges).
     */
    private boolean assessmentReady;

    /** True if crisis/self-harm language was detected in this turn. */
    private boolean crisisDetected;

    /** The session ID echoed back for correlation. */
    private String sessionId;

    // ─────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MentalHealthSignals {

        /** Running PHQ-9 style depression score (0–27) */
        private Integer depressionScore;

        /** Running GAD-7 style anxiety score (0–21) */
        private Integer anxietyScore;

        /** Stress level indicator (0–10) */
        private Integer stressLevel;

        /** Sleep quality score (0–10, 10 = excellent) */
        private Integer sleepQuality;

        /** Appetite change indicator (0–10, 10 = healthy) */
        private Integer appetiteLevel;

        /** Social withdrawal indicator (0–10, 10 = fully engaged) */
        private Integer socialEngagement;

        /** Number of meaningful conversation turns completed so far */
        private Integer turnsCompleted;

        /** Suggested overall risk level if assessmentReady is true */
        private String estimatedRiskLevel;
    }
}
