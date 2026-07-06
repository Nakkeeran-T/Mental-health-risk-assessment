package com.example.demo.dto.response;

import com.example.demo.entity.Answer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerResponse {

    private Long id;
    private Long questionId;
    private String questionText;
    private int score;
    private String responseText;
    private LocalDateTime createdAt;

    public static AnswerResponse from(Answer answer) {
        return AnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getId())
                .questionText(answer.getQuestion().getQuestionText())
                .score(answer.getScore())
                .responseText(answer.getResponseText())
                .createdAt(answer.getCreatedAt())
                .build();
    }
}
