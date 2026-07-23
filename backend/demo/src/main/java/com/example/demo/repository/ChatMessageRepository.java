package com.example.demo.repository;

import com.example.demo.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatSessionIdOrderByCreatedAtAsc(Long chatSessionId);

    List<ChatMessage> findByChatSessionSessionIdOrderByCreatedAtAsc(String sessionId);
}
