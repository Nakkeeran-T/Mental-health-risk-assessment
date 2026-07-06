package com.example.demo.dto.response;

import com.example.demo.entity.MoodEntry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoodEntryResponse {

    private Long id;
    private Integer moodScore;
    private String note;
    private LocalDateTime createdAt;

    public static MoodEntryResponse from(MoodEntry entry) {
        return MoodEntryResponse.builder()
                .id(entry.getId())
                .moodScore(entry.getMoodScore())
                .note(entry.getNote())
                .createdAt(entry.getCreatedAt())
                .build();
    }
}
