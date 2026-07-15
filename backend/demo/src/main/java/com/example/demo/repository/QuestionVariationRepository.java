package com.example.demo.repository;

import com.example.demo.entity.QuestionVariation;
import com.example.demo.enums.AgeGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionVariationRepository extends JpaRepository<QuestionVariation, Long> {

    @EntityGraph(attributePaths = "question")
    List<QuestionVariation> findByAgeGroupAndActiveTrueAndQuestionActiveTrue(AgeGroup ageGroup);
}
