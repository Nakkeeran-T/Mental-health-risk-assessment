package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WearableSyncRequest {
    private String deviceType;        // e.g. "APPLE_WATCH", "FITBIT", "GARMIN"
    private String deviceModel;       // e.g. "Apple Watch Series 9"
    private Double hrvRmssd;          // e.g. 42.5 ms
    private Integer restingHeartRate; // e.g. 64 bpm
    private Integer sleepMinutes;     // e.g. 440 mins (7.3 hrs)
    private Integer deepSleepMinutes; // e.g. 85 mins
    private Integer remSleepMinutes;  // e.g. 95 mins
    private Double sleepEfficiency;   // e.g. 0.89 (89%)
    private Integer dailySteps;       // e.g. 6840
}
