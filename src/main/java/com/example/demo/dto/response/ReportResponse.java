package com.example.demo.dto.response;

import com.example.demo.entity.Report;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {

    private Long id;
    private Long userId;
    private Long assessmentId;
    private String summary;
    private String details;
    private LocalDateTime generatedAt;

    public static ReportResponse from(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .userId(report.getUser().getId())
                .assessmentId(report.getAssessment().getId())
                .summary(report.getSummary())
                .details(report.getDetails())
                .generatedAt(report.getGeneratedAt())
                .build();
    }
}
