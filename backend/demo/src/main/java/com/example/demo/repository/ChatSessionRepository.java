package com.example.demo.repository;

import com.example.demo.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);

    List<ChatSession> findByUserIdAndStatusNotOrderByUpdatedAtDesc(Long userId, String status);

    Optional<ChatSession> findBySessionId(String sessionId);

    Optional<ChatSession> findBySessionIdAndUserId(String sessionId, Long userId);
}
