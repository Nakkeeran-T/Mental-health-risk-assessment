package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * MoodEntry entity — a record of user's daily mood score and optional note.
 */
@Entity
@Table(name = "mood_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "mood_score", nullable = false)
    private Integer moodScore; // 1 (Severe) to 5 (Great)

    @Column(columnDefinition = "TEXT")
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
