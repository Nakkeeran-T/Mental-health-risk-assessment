package com.example.demo.dto.response;

import com.example.demo.entity.Recommendation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationResponse {

    private Long id;
    private Long assessmentId;
    private String title;
    private String description;
    private int priority;
    private String riskLevel;
    private LocalDateTime createdAt;

    public static RecommendationResponse from(Recommendation rec) {
        return RecommendationResponse.builder()
                .id(rec.getId())
                .assessmentId(rec.getAssessment().getId())
                .title(rec.getTitle())
                .description(rec.getDescription())
                .priority(rec.getPriority())
                .riskLevel(rec.getRiskLevel().name())
                .createdAt(rec.getCreatedAt())
                .build();
    }
}
