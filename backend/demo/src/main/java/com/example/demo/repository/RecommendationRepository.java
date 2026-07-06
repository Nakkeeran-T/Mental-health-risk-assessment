package com.example.demo.repository;

import com.example.demo.entity.Recommendation;
import com.example.demo.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByAssessmentId(Long assessmentId);

    List<Recommendation> findByRiskLevel(RiskLevel riskLevel);

    List<Recommendation> findByAssessmentIdOrderByPriorityAsc(Long assessmentId);
}
