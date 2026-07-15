package com.example.demo.repository;

import com.example.demo.entity.Question;
import com.example.demo.enums.QuestionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByCategory(QuestionCategory category);

    List<Question> findByActiveTrue();

    List<Question> findByActiveTrueOrderByIdAsc();

    List<Question> findByCategoryAndActiveTrue(QuestionCategory category);
}
