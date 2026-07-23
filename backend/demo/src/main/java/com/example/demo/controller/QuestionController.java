package com.example.demo.controller;

import com.example.demo.dto.request.QuestionRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.PersonalizedQuestionResponse;
import com.example.demo.dto.response.QuestionResponse;
import com.example.demo.enums.QuestionCategory;
import com.example.demo.service.QuestionPersonalizationService;
import com.example.demo.service.QuestionService;
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
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Questions", description = "Assessment question management")
public class QuestionController {

    private final QuestionService questionService;
    private final QuestionPersonalizationService questionPersonalizationService;

    /**
     * POST /api/questions  (ADMIN only)
     */
    @PostMapping
    @Operation(summary = "Create a new question (Admin only)")
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(@Valid @RequestBody QuestionRequest request) {
        QuestionResponse response = questionService.createQuestion(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question created", response));
    }

    /**
     * GET /api/questions
     */
    @GetMapping
    @Operation(summary = "Get all active questions")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getActiveQuestions() {
        return ResponseEntity.ok(ApiResponse.success(questionService.getActiveQuestions()));
    }

    /**
     * GET /api/questions/personalized
     */
    @GetMapping("/personalized")
    @Operation(summary = "Get personalized active questions for the current user")
    public ResponseEntity<ApiResponse<List<PersonalizedQuestionResponse>>> getPersonalizedQuestions(
            Authentication authentication
    ) {
        List<PersonalizedQuestionResponse> response =
                questionPersonalizationService.getPersonalizedQuestions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * GET /api/questions/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get question by ID")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getQuestionById(id)));
    }

    /**
     * GET /api/questions/category/{category}
     */
    @GetMapping("/category/{category}")
    @Operation(summary = "Get questions by category")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getByCategory(@PathVariable QuestionCategory category) {
        return ResponseEntity.ok(ApiResponse.success(questionService.getQuestionsByCategory(category)));
    }

    /**
     * PUT /api/questions/{id}  (ADMIN only)
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update a question (Admin only)")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request
    ) {
        QuestionResponse response = questionService.updateQuestion(id, request);
        return ResponseEntity.ok(ApiResponse.success("Question updated", response));
    }

    /**
     * DELETE /api/questions/{id}  (ADMIN only — soft delete)
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a question (Admin only — soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success("Question deleted", null));
    }
}
