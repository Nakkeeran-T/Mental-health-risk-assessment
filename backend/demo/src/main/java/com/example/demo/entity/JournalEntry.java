package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * JournalEntry entity — private daily journal/reflection written by the user.
 * Optionally linked to a mood score for correlation analysis.
 */
@Entity
@Table(name = "journal_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Optional mood score (1-5) tagged by the user when writing the entry.
     * Allows cross-analysis with formal MoodEntry logs.
     */
    @Column(name = "mood_tag")
    private Integer moodTag;

    /**
     * Free-form category label (e.g., "Gratitude", "Anxiety", "Goals").
     */
    @Column(length = 50)
    private String category;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
