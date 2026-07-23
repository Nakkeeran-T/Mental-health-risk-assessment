package com.example.demo.dto.response;

import com.example.demo.entity.Assessment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentResponse {

    private Long id;
    private Long userId;
    private Integer totalScore;
    private String riskLevel;
    private String status;
    private String source;           // MANUAL or AI_CHAT
    private Double mlRiskConfidence; // XGBoost confidence (0.0–1.0), null if rule-based
    private String mlEmotion;        // NLP-detected emotion (AI_CHAT only)
    private String notes;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime completedAt;
    private List<AnswerResponse> answers;
    private List<RecommendationResponse> recommendations;

    public static AssessmentResponse from(Assessment assessment) {
        return AssessmentResponse.builder()
                .id(assessment.getId())
                .userId(assessment.getUser().getId())
                .totalScore(assessment.getTotalScore())
                .riskLevel(assessment.getRiskLevel() != null ? assessment.getRiskLevel().name() : null)
                .status(assessment.getStatus().name())
                .source(assessment.getSource() != null ? assessment.getSource().name() : "MANUAL")
                .mlRiskConfidence(assessment.getMlRiskConfidence())
                .mlEmotion(assessment.getMlEmotion())
                .notes(assessment.getNotes())
                .createdAt(assessment.getCreatedAt())
                .completedAt(assessment.getCompletedAt())
                .answers(assessment.getAnswers().stream().map(AnswerResponse::from).toList())
                .recommendations(assessment.getRecommendations().stream().map(RecommendationResponse::from).toList())
                .build();
    }

    public static AssessmentResponse summary(Assessment assessment) {
        return AssessmentResponse.builder()
                .id(assessment.getId())
                .userId(assessment.getUser().getId())
                .totalScore(assessment.getTotalScore())
                .riskLevel(assessment.getRiskLevel() != null ? assessment.getRiskLevel().name() : null)
                .status(assessment.getStatus().name())
                .source(assessment.getSource() != null ? assessment.getSource().name() : "MANUAL")
                .mlRiskConfidence(assessment.getMlRiskConfidence())
                .mlEmotion(assessment.getMlEmotion())
                .createdAt(assessment.getCreatedAt())
                .completedAt(assessment.getCompletedAt())
                .build();
    }
}
