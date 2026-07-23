package com.example.demo.entity;

import com.example.demo.enums.AssessmentSource;
import com.example.demo.enums.AssessmentStatus;
import com.example.demo.enums.RiskLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Assessment entity — a single assessment session taken by a user.
 *
 * Relationships:
 *  • Many Assessments → One User             (each assessment belongs to one user)
 *  • One Assessment   → Many Answers          (contains multiple answered questions)
 *  • One Assessment   → Many Recommendations  (risk-based recommendations generated)
 *  • One Assessment   → Many Reports          (reports generated from this assessment)
 */
@Entity
@Table(name = "assessments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "total_score")
    private Integer totalScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AssessmentStatus status = AssessmentStatus.IN_PROGRESS;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * How this assessment was generated.
     * MANUAL  = user completed the PHQ-9/GAD-7/Stress questionnaire.
     * AI_CHAT = derived from an AI chatbot conversation session.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 10)
    @Builder.Default
    private AssessmentSource source = AssessmentSource.MANUAL;

    /**
     * Confidence score returned by the XGBoost ML risk classifier (0.0–1.0).
     * Null when ML service is unavailable and rule-based fallback was used.
     */
    @Column(name = "ml_risk_confidence")
    private Double mlRiskConfidence;

    /**
     * Dominant emotion detected by NLP model from chat conversation text.
     * Null for manual (questionnaire) assessments.
     */
    @Column(name = "ml_emotion", length = 30)
    private String mlEmotion;

    // ── Relationships ──────────────────────────────────────────

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Answer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Recommendation> recommendations = new ArrayList<>();

    @OneToMany(mappedBy = "assessment", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Report> reports = new ArrayList<>();
}
