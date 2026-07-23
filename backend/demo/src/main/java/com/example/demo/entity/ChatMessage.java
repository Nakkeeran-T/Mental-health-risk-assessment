package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * ChatMessage entity — stores individual user messages and bot responses for a ChatSession.
 */
@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession chatSession;

    @Column(nullable = false, length = 10)
    private String sender; // "USER" or "BOT"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "signals_json", columnDefinition = "TEXT")
    private String signalsJson;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
