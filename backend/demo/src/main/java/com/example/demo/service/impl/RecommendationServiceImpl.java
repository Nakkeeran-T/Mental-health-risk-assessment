package com.example.demo.service.impl;

import com.example.demo.dto.response.RecommendationResponse;
import com.example.demo.entity.Assessment;
import com.example.demo.entity.Recommendation;
import com.example.demo.enums.RiskLevel;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.AssessmentRepository;
import com.example.demo.repository.RecommendationRepository;
import com.example.demo.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final AssessmentRepository assessmentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RecommendationResponse> getRecommendationsByAssessmentId(Long assessmentId) {
        return recommendationRepository.findByAssessmentIdOrderByPriorityAsc(assessmentId)
                .stream()
                .map(RecommendationResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public List<RecommendationResponse> generateRecommendations(Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", assessmentId));

        RiskLevel riskLevel = assessment.getRiskLevel();
        List<Recommendation> recommendations = buildRecommendations(assessment, riskLevel);

        List<Recommendation> saved = recommendationRepository.saveAll(recommendations);
        return saved.stream().map(RecommendationResponse::from).toList();
    }

    // ── Recommendation Engine ──────────────────────────────────

    private List<Recommendation> buildRecommendations(Assessment assessment, RiskLevel riskLevel) {
        List<Recommendation> recommendations = new ArrayList<>();

        switch (riskLevel) {
            case LOW -> {
                recommendations.add(createRecommendation(assessment, riskLevel, 1,
                        "Maintain Healthy Habits",
                        "Continue your current wellness practices. Regular exercise, balanced diet, and adequate sleep are key to maintaining mental health."));
                recommendations.add(createRecommendation(assessment, riskLevel, 2,
                        "Mindfulness Practice",
                        "Consider incorporating mindfulness or meditation into your daily routine to sustain your positive mental state."));
            }
            case MODERATE -> {
                recommendations.add(createRecommendation(assessment, riskLevel, 1,
                        "Self-Care Routine",
                        "Establish a structured self-care routine including regular physical activity, journaling, and social interaction."));
                recommendations.add(createRecommendation(assessment, riskLevel, 2,
                        "Stress Management Techniques",
                        "Practice deep breathing exercises, progressive muscle relaxation, or guided imagery to manage stress."));
                recommendations.add(createRecommendation(assessment, riskLevel, 3,
                        "Consider Counselling",
                        "Speaking with a licensed counsellor can provide valuable coping strategies and emotional support."));
            }
            case HIGH -> {
                recommendations.add(createRecommendation(assessment, riskLevel, 1,
                        "Seek Professional Help",
                        "It is strongly recommended that you consult a mental health professional for a thorough evaluation and personalized treatment plan."));
                recommendations.add(createRecommendation(assessment, riskLevel, 2,
                        "Crisis Support Resources",
                        "Keep emergency contacts and crisis helpline numbers readily available. Reach out whenever you feel overwhelmed."));
                recommendations.add(createRecommendation(assessment, riskLevel, 3,
                        "Build a Support Network",
                        "Share your feelings with trusted friends or family members. Social support is critical during difficult times."));
                recommendations.add(createRecommendation(assessment, riskLevel, 4,
                        "Structured Daily Routine",
                        "Maintain a consistent daily schedule to provide stability and reduce anxiety."));
            }
            case CRITICAL -> {
                recommendations.add(createRecommendation(assessment, riskLevel, 1,
                        "Immediate Professional Intervention",
                        "Please seek immediate help from a psychiatrist or visit your nearest emergency mental health service. Your well-being is the top priority."));
                recommendations.add(createRecommendation(assessment, riskLevel, 2,
                        "Emergency Helpline",
                        "Contact a crisis helpline immediately if you are in distress. Trained counsellors are available 24/7 to help."));
                recommendations.add(createRecommendation(assessment, riskLevel, 3,
                        "Safety Planning",
                        "Work with a mental health professional to create a safety plan outlining steps to take during a crisis."));
                recommendations.add(createRecommendation(assessment, riskLevel, 4,
                        "Medication Evaluation",
                        "A psychiatrist can evaluate whether medication may be beneficial as part of a comprehensive treatment approach."));
                recommendations.add(createRecommendation(assessment, riskLevel, 5,
                        "Ongoing Monitoring",
                        "Regular follow-up assessments are critical. Schedule recurring check-ins with your mental health provider."));
            }
        }

        return recommendations;
    }

    private Recommendation createRecommendation(Assessment assessment, RiskLevel riskLevel,
                                                 int priority, String title, String description) {
        return Recommendation.builder()
                .assessment(assessment)
                .riskLevel(riskLevel)
                .priority(priority)
                .title(title)
                .description(description)
                .build();
    }
}
