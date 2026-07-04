package com.example.demo.service;

import com.example.demo.dto.request.QuestionRequest;
import com.example.demo.dto.response.QuestionResponse;
import com.example.demo.enums.QuestionCategory;

import java.util.List;

public interface QuestionService {

    QuestionResponse createQuestion(QuestionRequest request);

    QuestionResponse getQuestionById(Long id);

    List<QuestionResponse> getAllQuestions();

    List<QuestionResponse> getActiveQuestions();

    List<QuestionResponse> getQuestionsByCategory(QuestionCategory category);

    QuestionResponse updateQuestion(Long id, QuestionRequest request);

    void deleteQuestion(Long id);
}
