package com.example.demo.repository;

import com.example.demo.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    List<JournalEntry> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<JournalEntry> findByIdAndUserId(Long id, Long userId);
}
