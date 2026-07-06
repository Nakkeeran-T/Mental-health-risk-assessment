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
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private List<AnswerResponse> answers;
    private List<RecommendationResponse> recommendations;

    public static AssessmentResponse from(Assessment assessment) {
        return AssessmentResponse.builder()
                .id(assessment.getId())
                .userId(assessment.getUser().getId())
                .totalScore(assessment.getTotalScore())
                .riskLevel(assessment.getRiskLevel() != null ? assessment.getRiskLevel().name() : null)
                .status(assessment.getStatus().name())
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
                .createdAt(assessment.getCreatedAt())
                .completedAt(assessment.getCompletedAt())
                .build();
    }
}
