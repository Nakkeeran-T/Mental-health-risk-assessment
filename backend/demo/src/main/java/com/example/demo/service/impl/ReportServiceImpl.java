package com.example.demo.service.impl;

import com.example.demo.dto.response.ReportResponse;
import com.example.demo.entity.Assessment;
import com.example.demo.entity.Report;
import com.example.demo.entity.User;
import com.example.demo.enums.AssessmentStatus;
import com.example.demo.exception.BadRequestException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssessmentRepository;
import com.example.demo.repository.ReportRepository;
import com.example.demo.service.ReportService;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final AssessmentRepository assessmentRepository;
    private final UserService userService;

    @Override
    @Transactional
    public ReportResponse generateReport(Long assessmentId, String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));

        if (!assessment.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Assessment", "id", assessmentId);
        }

        if (assessment.getStatus() != AssessmentStatus.COMPLETED) {
            throw new BadRequestException("Cannot generate report for an incomplete assessment");
        }

        if (reportRepository.findByAssessmentId(assessmentId).isPresent()) {
            throw new BadRequestException("A report has already been generated for this assessment");
        }

        String summary = buildSummary(assessment);
        String details = buildDetails(assessment);

        Report report = Report.builder()
                .user(user)
                .assessment(assessment)
                .summary(summary)
                .details(details)
                .build();

        return ReportResponse.from(reportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", id));
        return ReportResponse.from(report);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse getReportByAssessmentId(Long assessmentId, String userEmail) {
        Report report = reportRepository.findByAssessmentId(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "assessmentId", assessmentId));

        if (!report.getUser().getEmail().equals(userEmail)) {
            throw new ResourceNotFoundException("Report", "assessmentId", assessmentId);
        }

        return ReportResponse.from(report);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsByUser(String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        return reportRepository.findByUserIdOrderByGeneratedAtDesc(user.getId())
                .stream()
                .map(ReportResponse::from)
                .toList();
    }

    // ── Report Content Builders ─────────────────────────────

    private String buildSummary(Assessment assessment) {
        return String.format(
                "Mental Health Assessment Report — Risk Level: %s | Total Score: %d | Status: %s | Completed: %s",
                assessment.getRiskLevel(),
                assessment.getTotalScore(),
                assessment.getStatus(),
                assessment.getCompletedAt()
        );
    }

    private String buildDetails(Assessment assessment) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== Assessment Details ===\n\n");
        sb.append(String.format("Assessment ID: %d%n", assessment.getId()));
        sb.append(String.format("Risk Level: %s%n", assessment.getRiskLevel()));
        sb.append(String.format("Total Score: %d%n", assessment.getTotalScore()));
        sb.append(String.format("Questions Answered: %d%n", assessment.getAnswers().size()));
        sb.append(String.format("Completed At: %s%n%n", assessment.getCompletedAt()));

        sb.append("=== Responses ===\n\n");
        assessment.getAnswers().forEach(answer -> {
            sb.append(String.format("Q: %s%n", answer.getQuestion().getQuestionText()));
            sb.append(String.format("   Score: %d / %d%n", answer.getScore(), answer.getQuestion().getMaxScore()));
            if (answer.getResponseText() != null && !answer.getResponseText().isBlank()) {
                sb.append(String.format("   Response: %s%n", answer.getResponseText()));
            }
            sb.append("\n");
        });

        sb.append("=== Recommendations ===\n\n");
        assessment.getRecommendations().forEach(rec -> {
            sb.append(String.format("%d. %s%n   %s%n%n", rec.getPriority(), rec.getTitle(), rec.getDescription()));
        });

        if (assessment.getNotes() != null && !assessment.getNotes().isBlank()) {
            sb.append("=== Notes ===\n\n");
            sb.append(assessment.getNotes()).append("\n");
        }

        return sb.toString();
    }
}
