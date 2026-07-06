package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.RecommendationResponse;
import com.example.demo.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Recommendations", description = "AI-generated mental health recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * GET /api/recommendations/assessment/{assessmentId}
     *
     * Response JSON:
     * {
     *   "success": true,
     *   "data": [
     *     {
     *       "id": 1,
     *       "assessmentId": 1,
     *       "title": "Seek Professional Help",
     *       "description": "...",
     *       "priority": 1,
     *       "riskLevel": "HIGH"
     *     }
     *   ]
     * }
     */
    @GetMapping("/assessment/{assessmentId}")
    @Operation(summary = "Get recommendations for an assessment")
    public ResponseEntity<ApiResponse<List<RecommendationResponse>>> getRecommendations(
            @PathVariable Long assessmentId
    ) {
        List<RecommendationResponse> recs = recommendationService.getRecommendationsByAssessmentId(assessmentId);
        return ResponseEntity.ok(ApiResponse.success(recs));
    }
}
