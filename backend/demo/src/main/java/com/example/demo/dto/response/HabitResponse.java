package com.example.demo.dto.response;

import com.example.demo.entity.Habit;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitResponse {

    private Long id;
    private String title;
    private String description;
    private Integer streakCount;
    private LocalDateTime lastCompletedAt;
    private LocalDateTime createdAt;

    public static HabitResponse from(Habit habit) {
        return HabitResponse.builder()
                .id(habit.getId())
                .title(habit.getTitle())
                .description(habit.getDescription())
                .streakCount(habit.getStreakCount())
                .lastCompletedAt(habit.getLastCompletedAt())
                .createdAt(habit.getCreatedAt())
                .build();
    }
}
