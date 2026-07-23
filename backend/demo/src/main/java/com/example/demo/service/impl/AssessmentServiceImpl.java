package com.example.demo.service.impl;

import com.example.demo.dto.request.AnswerRequest;
import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.entity.Answer;
import com.example.demo.entity.Assessment;
import com.example.demo.entity.Question;
import com.example.demo.entity.User;
import com.example.demo.enums.AssessmentSource;
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

        Assessment assessment = Assessment.builder()
                .user(user)
                .status(AssessmentStatus.IN_PROGRESS)
                .notes(request.getNotes())
                .source(AssessmentSource.MANUAL)
                .build();

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

        Map<QuestionCategory, List<Answer>> groupedAnswers = assessment.getAnswers().stream()
                .collect(Collectors.groupingBy(a -> a.getQuestion().getCategory()));

        List<Answer> depressionAnswers = groupedAnswers.get(QuestionCategory.DEPRESSION);
        List<Answer> anxietyAnswers = groupedAnswers.get(QuestionCategory.ANXIETY);
        List<Answer> stressAnswers = groupedAnswers.get(QuestionCategory.STRESS);

        int depScore = sumScores(depressionAnswers);
        int anxScore = sumScores(anxietyAnswers);
        int stressScore = sumScores(stressAnswers);

        int maxStress = maxScores(stressAnswers);
        int stressNorm = maxStress > 0 ? (int) Math.round((double) stressScore / maxStress * 10) : 5;

        RiskAssessmentEngine.RiskAssessmentResult mlResult = riskAssessmentEngine.predictWithMl(
                depScore, anxScore, stressNorm,
                7, // sleep_quality: default mid-range (not collected in questionnaire)
                7, // social_engagement: default mid-range
                7 // appetite_level: default mid-range
        );

        RiskLevel overallRisk = mlResult.riskLevel();
        Double mlConfidence = mlResult.mlConfidence();

        if (overallRisk == null) {
            RiskLevel depressionRisk = riskAssessmentEngine.calculatePhq9Score(depressionAnswers);
            RiskLevel anxietyRisk = riskAssessmentEngine.calculateGad7Score(anxietyAnswers);
            RiskLevel stressRisk = riskAssessmentEngine.calculateStressScore(stressAnswers);
            overallRisk = riskAssessmentEngine.determineOverallRiskLevel(depressionRisk, anxietyRisk, stressRisk);
        }

        assessment.setTotalScore(totalScore);
        assessment.setRiskLevel(overallRisk);
        assessment.setMlRiskConfidence(mlConfidence);
        assessment.setStatus(AssessmentStatus.COMPLETED);
        assessment.setCompletedAt(java.time.LocalDateTime.now());

        Assessment savedAssessment = assessmentRepository.save(assessment);

        recommendationService.generateRecommendations(savedAssessment.getId());

        Assessment refreshed = assessmentRepository.findById(savedAssessment.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", savedAssessment.getId()));

        return AssessmentResponse.from(refreshed);
    }

    @Override
    @Transactional(readOnly = true)
    public AssessmentResponse getAssessmentById(Long id, String userEmail) {
        Assessment assessment = assessmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", id));

        // Users can only view their own assessments (admin bypass handled at controller
        // level)
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

    // ── Internal helpers ──────────────────────────────────────────────────────

    private int sumScores(List<Answer> answers) {
        if (answers == null || answers.isEmpty())
            return 0;
        return answers.stream().mapToInt(Answer::getScore).sum();
    }

    private int maxScores(List<Answer> answers) {
        if (answers == null || answers.isEmpty())
            return 0;
        return answers.stream().mapToInt(a -> a.getQuestion().getMaxScore()).sum();
    }
}
