package com.example.demo.service.impl;

import com.example.demo.dto.request.QuestionRequest;
import com.example.demo.dto.response.QuestionResponse;
import com.example.demo.entity.Question;
import com.example.demo.enums.QuestionCategory;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;

    @Override
    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Question question = Question.builder()
                .questionText(request.getQuestionText())
                .category(request.getCategory())
                .maxScore(request.getMaxScore())
                .active(true)
                .build();
        return QuestionResponse.from(questionRepository.save(question));
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponse getQuestionById(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));
        return QuestionResponse.from(question);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getAllQuestions() {
        return questionRepository.findAll().stream()
                .map(QuestionResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getActiveQuestions() {
        return questionRepository.findByActiveTrue().stream()
                .map(QuestionResponse::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestionsByCategory(QuestionCategory category) {
        return questionRepository.findByCategoryAndActiveTrue(category).stream()
                .map(QuestionResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));

        question.setQuestionText(request.getQuestionText());
        question.setCategory(request.getCategory());
        question.setMaxScore(request.getMaxScore());

        return QuestionResponse.from(questionRepository.save(question));
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", id));
        // Soft delete — deactivate instead of removing
        question.setActive(false);
        questionRepository.save(question);
    }
}
