package com.example.demo.dto.request;

import com.example.demo.enums.QuestionCategory;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Category is required")
    private QuestionCategory category;

    @Min(value = 1, message = "Max score must be at least 1")
    @Max(value = 10, message = "Max score must not exceed 10")
    private int maxScore;
}
