package com.example.demo.repository;

import com.example.demo.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    
    List<Habit> findByUserIdOrderByCreatedAtDesc(Long userId);
}
