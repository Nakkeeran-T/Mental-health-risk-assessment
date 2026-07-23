package com.example.demo.controller;

import com.example.demo.dto.request.MoodRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.MoodEntryResponse;
import com.example.demo.entity.MoodEntry;
import com.example.demo.entity.User;
import com.example.demo.repository.MoodEntryRepository;
import com.example.demo.service.MlService;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mood")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Mood Entries", description = "Endpoints for daily mood tracking and journaling")
public class MoodController {

    private final MoodEntryRepository moodEntryRepository;
    private final UserService userService;
    private final MlService mlService;

    @PostMapping
    @Operation(summary = "Log a new daily mood entry")
    public ResponseEntity<ApiResponse<MoodEntryResponse>> logMood(
            @Valid @RequestBody MoodRequest request,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());

        MoodEntry moodEntry = MoodEntry.builder()
                .user(user)
                .moodScore(request.getMoodScore())
                .note(request.getNote())
                .build();

        MoodEntry saved = moodEntryRepository.save(moodEntry);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mood logged successfully", MoodEntryResponse.from(saved)));
    }

    @GetMapping("/history")
    @Operation(summary = "Get mood logging history for the current user")
    public ResponseEntity<ApiResponse<List<MoodEntryResponse>>> getMoodHistory(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        List<MoodEntryResponse> history = moodEntryRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(MoodEntryResponse::from)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/forecast")
    @Operation(summary = "Predict tomorrow's mood using ML linear regression on last 7 days")
    public ResponseEntity<ApiResponse<Object>> getMoodForecast(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());

        // Fetch last 7 mood scores (oldest first for time-series ordering)
        List<Integer> scores = moodEntryRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .limit(7)
                .map(MoodEntry::getMoodScore)
                .collect(java.util.stream.Collectors.collectingAndThen(
                        java.util.stream.Collectors.toList(),
                        list -> { java.util.Collections.reverse(list); return list; }
                ));

        if (scores.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(
                    "No mood data available for forecast",
                    java.util.Map.of("message", "Log at least 1 mood entry to get a forecast.")
            ));
        }

        MlService.MlMoodResult forecast = mlService.forecastMood(scores);

        if (forecast == null) {
            return ResponseEntity.ok(ApiResponse.success(
                    "ML service unavailable",
                    java.util.Map.of("message", "Mood forecast requires the ML service to be running.")
            ));
        }

        return ResponseEntity.ok(ApiResponse.success("Mood forecast generated", forecast));
    }
}
