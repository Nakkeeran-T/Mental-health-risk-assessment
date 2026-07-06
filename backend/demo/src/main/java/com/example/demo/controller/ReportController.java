package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.ReportResponse;
import com.example.demo.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Reports", description = "Assessment report generation and retrieval")
public class ReportController {

    private final ReportService reportService;

    /**
     * POST /api/reports/generate/{assessmentId}
     *
     * Response JSON:
     * {
     *   "success": true,
     *   "message": "Report generated",
     *   "data": {
     *     "id": 1,
     *     "userId": 1,
     *     "assessmentId": 1,
     *     "summary": "Mental Health Assessment Report — ...",
     *     "details": "=== Assessment Details === ..."
     *   }
     * }
     */
    @PostMapping("/generate/{assessmentId}")
    @Operation(summary = "Generate a report for a completed assessment")
    public ResponseEntity<ApiResponse<ReportResponse>> generateReport(
            @PathVariable Long assessmentId,
            Authentication authentication
    ) {
        ReportResponse response = reportService.generateReport(assessmentId, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Report generated", response));
    }

    /**
     * GET /api/reports/assessment/{assessmentId}
     */
    @GetMapping("/assessment/{assessmentId}")
    @Operation(summary = "Get report by assessment ID")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportByAssessmentId(
            @PathVariable Long assessmentId,
            Authentication authentication
    ) {
        ReportResponse response = reportService.getReportByAssessmentId(assessmentId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/reports/user
     */
    @GetMapping("/user")
    @Operation(summary = "Get all reports for the current user")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> getUserReports(Authentication authentication) {
        List<ReportResponse> reports = reportService.getReportsByUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(reports));
    }

    /**
     * GET /api/reports/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get a report by ID")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(reportService.getReportById(id)));
    }
}
