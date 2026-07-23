package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.WellnessScoreResponse;
import com.example.demo.entity.Assessment;
import com.example.demo.entity.Habit;
import com.example.demo.entity.MoodEntry;
import com.example.demo.entity.User;
import com.example.demo.enums.AssessmentStatus;
import com.example.demo.repository.AssessmentRepository;
import com.example.demo.repository.HabitRepository;
import com.example.demo.repository.JournalEntryRepository;
import com.example.demo.repository.MoodEntryRepository;
import com.example.demo.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * WellnessController — computes a composite Wellness Score from four tracked dimensions:
 *   1. Risk Score   — inverted from latest assessment (lower risk = higher wellness)
 *   2. Mood Score   — average of last 7 mood log entries (scaled 0-100)
 *   3. Habit Score  — percentage of habits completed today
 *   4. Journal Score — engagement based on journal entries in last 7 days (capped at 100)
 */
@RestController
@RequestMapping("/api/wellness")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Wellness Score", description = "Composite wellness analytics endpoint")
public class WellnessController {

    private final AssessmentRepository assessmentRepository;
    private final MoodEntryRepository moodEntryRepository;
    private final HabitRepository habitRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final UserService userService;

    @GetMapping("/score")
    @Operation(summary = "Get the composite wellness score for the current user")
    public ResponseEntity<ApiResponse<WellnessScoreResponse>> getWellnessScore(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        Long userId = user.getId();

        // ── 1. Risk Score ──────────────────────────────────────
        // Get latest completed assessment. Invert the score to wellness.
        // Assume max possible score = 40 (adjust if different).
        List<Assessment> assessments = assessmentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        Assessment latestAssessment = assessments.stream()
                .filter(a -> a.getStatus() == AssessmentStatus.COMPLETED)
                .findFirst()
                .orElse(null);

        int riskScore = 50;
        long daysSinceLastAssessment = 999;
        boolean assessmentDue = true;

        if (latestAssessment != null) {
            int maxScore = 40;
            int rawScore = latestAssessment.getTotalScore() != null ? latestAssessment.getTotalScore() : 0;
            riskScore = Math.max(0, Math.min(100, (int) (((double)(maxScore - rawScore) / maxScore) * 100)));

            if (latestAssessment.getCreatedAt() != null) {
                daysSinceLastAssessment = ChronoUnit.DAYS.between(
                        latestAssessment.getCreatedAt().toLocalDate(), LocalDate.now());
                assessmentDue = daysSinceLastAssessment > 7;
            }
        }

        // ── 2. Mood Score ──────────────────────────────────────
        // Average of last 7 mood entries, scaled from 1-5 range to 0-100.
        List<MoodEntry> recentMoods = moodEntryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int moodScore = 50;
        if (!recentMoods.isEmpty()) {
            List<MoodEntry> last7 = recentMoods.subList(0, Math.min(7, recentMoods.size()));
            double avg = last7.stream().mapToInt(MoodEntry::getMoodScore).average().orElse(3.0);
            moodScore = (int) Math.round(((avg - 1.0) / 4.0) * 100);
        }

        // ── 3. Habit Score ────────────────────────────────────
        // Percentage of habits completed today.
        List<Habit> habits = habitRepository.findByUserIdOrderByCreatedAtDesc(userId);
        int habitScore = 0;
        if (!habits.isEmpty()) {
            LocalDate today = LocalDate.now();
            long completedToday = habits.stream()
                    .filter(h -> h.getLastCompletedAt() != null &&
                            h.getLastCompletedAt().toLocalDate().equals(today))
                    .count();
            habitScore = (int) Math.round(((double) completedToday / habits.size()) * 100);
        } else {
            habitScore = 50;
        }

        // ── 4. Journal Score ──────────────────────────────────
        // Engagement: each entry in last 7 days = ~14 points (7 entries = 100)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        long journalCount = journalEntryRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(j -> j.getCreatedAt().isAfter(sevenDaysAgo))
                .count();
        int journalScore = (int) Math.min(100, journalCount * 14);

        // ── Overall Score ──────────────────────────────────────
        int overallScore = (riskScore + moodScore + habitScore + journalScore) / 4;

        WellnessScoreResponse response = WellnessScoreResponse.builder()
                .riskScore(riskScore)
                .moodScore(moodScore)
                .habitScore(habitScore)
                .journalScore(journalScore)
                .overallScore(overallScore)
                .daysSinceLastAssessment(daysSinceLastAssessment)
                .assessmentDue(assessmentDue)
                .build();

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
