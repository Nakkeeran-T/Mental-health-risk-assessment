package com.example.demo.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    @Min(value = 0, message = "Score must be at least 0")
    @Max(value = 10, message = "Score must not exceed 10")
    private int score;

    private String responseText;
}
