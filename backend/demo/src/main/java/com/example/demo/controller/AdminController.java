package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.dto.response.UserResponse;
import com.example.demo.service.AssessmentService;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin", description = "Admin-only management endpoints")
public class AdminController {

    private final UserService userService;
    private final AssessmentService assessmentService;

    /**
     * GET /api/admin/users
     */
    @GetMapping("/users")
    @Operation(summary = "Get all users (Admin only)")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers()));
    }

    /**
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    /**
     * GET /api/admin/assessments
     */
    @GetMapping("/assessments")
    @Operation(summary = "Get all assessments (Admin only)")
    public ResponseEntity<ApiResponse<List<AssessmentResponse>>> getAllAssessments() {
        return ResponseEntity.ok(ApiResponse.success(assessmentService.getAllAssessments()));
    }

    /**
     * GET /api/admin/stats
     *
     * Response JSON:
     * {
     *   "success": true,
     *   "data": {
     *     "totalUsers": 42,
     *     "totalAssessments": 128
     *   }
     * }
     */
    @GetMapping("/stats")
    @Operation(summary = "Get platform statistics (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.getAllUsers().size());
        stats.put("totalAssessments", assessmentService.getAllAssessments().size());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
