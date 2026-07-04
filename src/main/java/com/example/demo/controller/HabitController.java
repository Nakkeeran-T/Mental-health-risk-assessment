package com.example.demo.controller;

import com.example.demo.dto.request.HabitRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.HabitResponse;
import com.example.demo.entity.Habit;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.HabitRepository;
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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Self-care Habits", description = "Endpoints for mental health habits and goals tracking")
public class HabitController {

    private final HabitRepository habitRepository;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all self-care habits for the current user")
    public ResponseEntity<ApiResponse<List<HabitResponse>>> getHabits(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        List<HabitResponse> habits = habitRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(HabitResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(habits));
    }

    @PostMapping
    @Operation(summary = "Create a new custom self-care habit")
    public ResponseEntity<ApiResponse<HabitResponse>> createHabit(
            @Valid @RequestBody HabitRequest request,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());

        Habit habit = Habit.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .streakCount(0)
                .build();

        Habit saved = habitRepository.save(habit);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Habit created successfully", HabitResponse.from(saved)));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Toggle completion of a habit for today")
    public ResponseEntity<ApiResponse<HabitResponse>> completeHabit(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", "id", id));

        if (!habit.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Habit", "id", id);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastCompleted = habit.getLastCompletedAt();

        if (lastCompleted != null && lastCompleted.toLocalDate().equals(now.toLocalDate())) {
            // Already completed today: toggle it back to incomplete
            habit.setLastCompletedAt(null);
            habit.setStreakCount(Math.max(0, habit.getStreakCount() - 1));
        } else {
            // Not completed today
            if (lastCompleted != null && lastCompleted.toLocalDate().equals(now.toLocalDate().minusDays(1))) {
                // Completed yesterday: increment streak
                habit.setStreakCount(habit.getStreakCount() + 1);
            } else {
                // Broken streak or first time: reset to 1
                habit.setStreakCount(1);
            }
            habit.setLastCompletedAt(now);
        }

        Habit saved = habitRepository.save(habit);
        return ResponseEntity.ok(ApiResponse.success("Habit status toggled", HabitResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a self-care habit")
    public ResponseEntity<ApiResponse<Void>> deleteHabit(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());
        Habit habit = habitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", "id", id));

        if (!habit.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Habit", "id", id);
        }

        habitRepository.delete(habit);
        return ResponseEntity.ok(ApiResponse.success("Habit deleted successfully", null));
    }
}
