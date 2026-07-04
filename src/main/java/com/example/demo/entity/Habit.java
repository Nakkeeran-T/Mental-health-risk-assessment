package com.example.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Habit entity — represents a mental health/self-care goal or habit.
 */
@Entity
@Table(name = "habits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Habit title is required")
    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "streak_count", nullable = false)
    @Builder.Default
    private Integer streakCount = 0;

    @Column(name = "last_completed_at")
    private LocalDateTime lastCompletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
