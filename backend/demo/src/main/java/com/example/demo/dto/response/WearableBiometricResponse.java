package com.example.demo.dto.response;

import com.example.demo.entity.WearableBiometric;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WearableBiometricResponse {
    private Long id;
    private String deviceType;
    private String deviceModel;
    private Double hrvRmssd;
    private Integer restingHeartRate;
    private Integer sleepMinutes;
    private Integer deepSleepMinutes;
    private Integer remSleepMinutes;
    private Double sleepEfficiency;
    private Integer dailySteps;
    private Integer stressScore;
    private Integer sleepQualityScore;
    private LocalDateTime syncedAt;
    private String statusMessage;

    public static WearableBiometricResponse from(WearableBiometric entity) {
        if (entity == null) return null;
        return WearableBiometricResponse.builder()
                .id(entity.getId())
                .deviceType(entity.getDeviceType())
                .deviceModel(entity.getDeviceModel())
                .hrvRmssd(entity.getHrvRmssd())
                .restingHeartRate(entity.getRestingHeartRate())
                .sleepMinutes(entity.getSleepMinutes())
                .deepSleepMinutes(entity.getDeepSleepMinutes())
                .remSleepMinutes(entity.getRemSleepMinutes())
                .sleepEfficiency(entity.getSleepEfficiency())
                .dailySteps(entity.getDailySteps())
                .stressScore(entity.getStressScore())
                .sleepQualityScore(entity.getSleepQualityScore())
                .syncedAt(entity.getSyncedAt())
                .statusMessage("Connected & Synchronized")
                .build();
    }
}
