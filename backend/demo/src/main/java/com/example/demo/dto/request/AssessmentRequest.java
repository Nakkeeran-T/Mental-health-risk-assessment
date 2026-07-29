package com.example.demo.dto.request;

import com.example.demo.enums.AssessmentSource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentRequest {

    @NotEmpty(message = "At least one answer is required")
    @Valid
    private List<AnswerRequest> answers;

    private String notes;

    /** Optional — defaults to MANUAL if not provided */
    private AssessmentSource source;
}

