package com.example.demo.repository;

import com.example.demo.entity.Assessment;
import com.example.demo.enums.RiskLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByUserId(Long userId);

    List<Assessment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Assessment> findByRiskLevel(RiskLevel riskLevel);

    long countByUserId(Long userId);
}
