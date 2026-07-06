package com.example.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Answer entity — a user's response to a single question within an assessment.
 *
 * Relationships:
 *  • Many Answers → One Assessment  (each answer belongs to one assessment session)
 *  • Many Answers → One Question    (each answer is for one specific question)
 */
@Entity
@Table(name = "answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Min(value = 0, message = "Score must be at least 0")
    @Max(value = 10, message = "Score must not exceed 10")
    @Column(nullable = false)
    private int score;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
