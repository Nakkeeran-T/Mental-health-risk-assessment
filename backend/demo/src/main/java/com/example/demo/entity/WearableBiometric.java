package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * WearableBiometric entity — physiological telemetry ingested from smartwatches and bands
 * (Apple Watch, Fitbit, Garmin, Whoop, Wear OS).
 *
 * Captures continuous digital phenotyping biomarkers:
 *  • Heart Rate Variability (HRV in RMSSD ms) — autonomic stress indicator
 *  • Resting Heart Rate (bpm)
 *  • Polysomnographic Sleep Stages (Total minutes, Deep sleep, REM, Efficiency)
 *  • Daily Step Count & Physical Mobility
 */
@Entity
@Table(name = "wearable_biometrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WearableBiometric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "device_type", length = 50)
    private String deviceType; // APPLE_WATCH, FITBIT, GARMIN, WHOOP, WEAR_OS

    @Column(name = "device_model", length = 100)
    private String deviceModel;

    @Column(name = "hrv_rmssd")
    private Double hrvRmssd; // Root Mean Square of Successive Differences in ms

    @Column(name = "resting_heart_rate")
    private Integer restingHeartRate; // bpm

    @Column(name = "sleep_minutes")
    private Integer sleepMinutes; // Total sleep duration

    @Column(name = "deep_sleep_minutes")
    private Integer deepSleepMinutes; // Restorative deep sleep

    @Column(name = "rem_sleep_minutes")
    private Integer remSleepMinutes;

    @Column(name = "sleep_efficiency")
    private Double sleepEfficiency; // 0.0 – 1.0 (e.g. 0.88 = 88%)

    @Column(name = "daily_steps")
    private Integer dailySteps; // Activity / mobility index

    @Column(name = "stress_score")
    private Integer stressScore; // Derived autonomic stress (0–10)

    @Column(name = "sleep_quality_score")
    private Integer sleepQualityScore; // Derived sleep quality (0–10)

    @CreationTimestamp
    @Column(name = "synced_at", nullable = false, updatable = false)
    private LocalDateTime syncedAt;
}
