package com.example.demo.repository;

import com.example.demo.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findByUserId(Long userId);

    Optional<Report> findByAssessmentId(Long assessmentId);

    List<Report> findByUserIdOrderByGeneratedAtDesc(Long userId);
}
