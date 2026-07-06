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
public class MoodRequest {

    @NotNull(message = "Mood score is required")
    @Min(value = 1, message = "Mood score must be at least 1")
    @Max(value = 5, message = "Mood score must not exceed 5")
    private Integer moodScore;

    private String note;
}
