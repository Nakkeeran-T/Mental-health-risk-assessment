package com.example.demo.dto.response;

import com.example.demo.entity.Question;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionResponse {

    private Long id;
    private String questionText;
    private String category;
    private int maxScore;
    private boolean active;
    private LocalDateTime createdAt;

    public static QuestionResponse from(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .questionText(question.getQuestionText())
                .category(question.getCategory().name())
                .maxScore(question.getMaxScore())
                .active(question.isActive())
                .createdAt(question.getCreatedAt())
                .build();
    }
}
