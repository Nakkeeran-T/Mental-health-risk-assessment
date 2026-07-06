package com.example.demo.controller;

import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.service.AssessmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Assessments", description = "Mental health assessment submission and history")
public class AssessmentController {

    private final AssessmentService assessmentService;

    /**
     * POST /api/assessments/submit
     *
     * Request JSON:
     * {
     *   "answers": [
     *     { "questionId": 1, "score": 3, "responseText": "Sometimes" },
     *     { "questionId": 2, "score": 4 }
     *   ],
     *   "notes": "Feeling stressed lately"
     * }
     *
     * Response JSON:
     * {
     *   "success": true,
     *   "message": "Assessment submitted",
     *   "data": {
     *     "id": 1,
     *     "userId": 1,
     *     "totalScore": 7,
     *     "riskLevel": "MODERATE",
     *     "status": "COMPLETED",
     *     "answers": [...],
     *     "recommendations": [...]
     *   }
     * }
     */
    @PostMapping("/submit")
    @Operation(summary = "Submit a new assessment")
    public ResponseEntity<ApiResponse<AssessmentResponse>> submitAssessment(
            Authentication authentication,
            @Valid @RequestBody AssessmentRequest request
    ) {
        AssessmentResponse response = assessmentService.submitAssessment(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Assessment submitted", response));
    }

    /**
     * GET /api/assessments/history
     */
    @GetMapping("/history")
    @Operation(summary = "Get assessment history for the current user")
    public ResponseEntity<ApiResponse<List<AssessmentResponse>>> getHistory(Authentication authentication) {
        List<AssessmentResponse> history = assessmentService.getAssessmentHistory(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * GET /api/assessments/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get assessment details by ID")
    public ResponseEntity<ApiResponse<AssessmentResponse>> getAssessmentById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        AssessmentResponse response = assessmentService.getAssessmentById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
