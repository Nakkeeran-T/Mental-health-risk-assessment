package com.example.demo.entity;

import com.example.demo.enums.AgeGroup;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Entity
@Table(
        name = "question_variations",
        indexes = {
                @Index(name = "idx_question_variations_age_group", columnList = "age_group"),
                @Index(name = "idx_question_variations_question", columnList = "question_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionVariation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Question is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @NotNull(message = "Age group is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "age_group", nullable = false, length = 20)
    private AgeGroup ageGroup;

    @NotBlank(message = "Variation text is required")
    @Column(name = "variation_text", nullable = false, columnDefinition = "TEXT")
    private String variationText;

    @Column(nullable = false)
    @Builder.Default
    private int version = 1;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;
}
