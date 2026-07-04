package com.example.demo.entity;

import com.example.demo.enums.RiskLevel;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Recommendation entity — AI-generated suggestion based on assessment risk level.
 *
 * Relationships:
 *  • Many Recommendations → One Assessment  (each recommendation belongs to one assessment)
 */
@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Description is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private int priority = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    private RiskLevel riskLevel;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
