package com.example.demo.dto.response;

import com.example.demo.entity.Question;
import com.example.demo.entity.QuestionVariation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalizedQuestionResponse {

    private Long questionId;
    private String masterQuestionCode;
    private String variationText;
    private String category;
    private int orderNumber;

    public static PersonalizedQuestionResponse fromVariation(
            QuestionVariation variation,
            String masterQuestionCode,
            int orderNumber
    ) {
        Question question = variation.getQuestion();
        return PersonalizedQuestionResponse.builder()
                .questionId(question.getId())
                .masterQuestionCode(masterQuestionCode)
                .variationText(variation.getVariationText())
                .category(question.getCategory().name())
                .orderNumber(orderNumber)
                .build();
    }

    public static PersonalizedQuestionResponse fromQuestion(
            Question question,
            String masterQuestionCode,
            int orderNumber
    ) {
        return PersonalizedQuestionResponse.builder()
                .questionId(question.getId())
                .masterQuestionCode(masterQuestionCode)
                .variationText(question.getQuestionText())
                .category(question.getCategory().name())
                .orderNumber(orderNumber)
                .build();
    }
}
