package com.example.demo.service.impl;

import com.example.demo.dto.request.AnswerRequest;
import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.entity.Answer;
import com.example.demo.entity.Assessment;
import com.example.demo.entity.Question;
import com.example.demo.entity.User;
import com.example.demo.enums.AssessmentStatus;
import com.example.demo.enums.QuestionCategory;
import com.example.demo.enums.RiskLevel;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssessmentRepository;
import com.example.demo.repository.QuestionRepository;
import com.example.demo.service.AssessmentService;
import com.example.demo.service.RecommendationService;
import com.example.demo.service.RiskAssessmentEngine;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssessmentServiceImpl implements AssessmentService {

    private final AssessmentRepository assessmentRepository;
    private final QuestionRepository questionRepository;
    private final UserService userService;
    private final RecommendationService recommendationService;
    private final RiskAssessmentEngine riskAssessmentEngine;

    @Override
    @Transactional
    public AssessmentResponse submitAssessment(String userEmail, AssessmentRequest request) {
        User user = userService.getCurrentUser(userEmail);

        // 1. Create the assessment
        Assessment assessment = Assessment.builder()
                .user(user)
                .status(AssessmentStatus.IN_PROGRESS)
                .notes(request.getNotes())
                .build();

        // 2. Process each answer
        int totalScore = 0;

        for (AnswerRequest answerReq : request.getAnswers()) {
            Question question = questionRepository.findById(answerReq.getQuestionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Question", "id", answerReq.getQuestionId()));

            Answer answer = Answer.builder()
                    .assessment(assessment)
                    .question(question)
                    .score(answerReq.getScore())
                    .responseText(answerReq.getResponseText())
                    .build();

            assessment.getAnswers().add(answer);
            totalScore += answerReq.getScore();
        }

        // Group answers by category for specific scale scoring
        Map<QuestionCategory, List<Answer>> groupedAnswers = assessment.getAnswers().stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getCategory()));

        RiskLevel depressionRisk = riskAssessmentEngine.calculatePhq9Score(groupedAnswers.get(QuestionCategory.DEPRESSION));
        RiskLevel anxietyRisk = riskAssessmentEngine.calculateGad7Score(groupedAnswers.get(QuestionCategory.ANXIETY));
        RiskLevel stressRisk = riskAssessmentEngine.calculateStressScore(groupedAnswers.get(QuestionCategory.STRESS));

        // 3. Determine overall risk level
        RiskLevel overallRisk = riskAssessmentEngine.determineOverallRiskLevel(depressionRisk, anxietyRisk, stressRisk);

        // Fallback for general or unspecified categories
        if (overallRisk == RiskLevel.LOW && depressionRisk == null && anxietyRisk == null && stressRisk == null) {
            overallRisk = riskAssessmentEngine.calculateStressScore(assessment.getAnswers());
        }

        assessment.setTotalScore(totalScore);
        assessment.setRiskLevel(overallRisk);
        assessment.setStatus(AssessmentStatus.COMPLETED);
        assessment.setCompletedAt(LocalDateTime.now());

        Assessment savedAssessment = assessmentRepository.save(assessment);

        // 4. Auto-generate recommendations based on risk level
        recommendationService.generateRecommendations(savedAssessment.getId());

        // Refresh to include generated recommendations
        Assessment refreshed = assessmentRepository.findById(savedAssessment.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", savedAssessment.getId()));

        return AssessmentResponse.from(refreshed);
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentResponse getAssessmentById(Long id, String userEmail) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", id));

        // Users can only view their own assessments (admin bypass handled at controller level)
        if (!assessment.getUser().getEmail().equals(userEmail)) {
            throw new ResourceNotFoundException("Assessment", "id", id);
        }

        return AssessmentResponse.from(assessment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssessmentResponse> getAssessmentHistory(String userEmail) {
        User user = userService.getCurrentUser(userEmail);
        return assessmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(AssessmentResponse::summary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssessmentResponse> getAllAssessments() {
        return assessmentRepository.findAll().stream()
                .map(AssessmentResponse::summary)
                .toList();
    }
}
