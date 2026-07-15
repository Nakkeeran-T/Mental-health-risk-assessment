package com.example.demo.entity;

import com.example.demo.enums.QuestionCategory;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Question entity — a single question in a mental health assessment.
 *
 * Relationships:
 *  • One Question → Many Answers  (the same question can appear in many assessments)
 */
@Entity
@Table(name = "questions", uniqueConstraints = @UniqueConstraint(columnNames = "question_text"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Question text is required")
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @NotNull(message = "Category is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private QuestionCategory category;

    @Min(value = 1, message = "Max score must be at least 1")
    @Max(value = 10, message = "Max score must not exceed 10")
    @Column(name = "max_score", nullable = false)
    @Builder.Default
    private int maxScore = 5;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ── Relationships ──────────────────────────────────────────

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionVariation> variations = new ArrayList<>();
}
