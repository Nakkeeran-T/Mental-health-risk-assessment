package com.example.demo.controller;

import com.example.demo.dto.request.JournalRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.JournalEntryResponse;
import com.example.demo.entity.JournalEntry;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.JournalEntryRepository;
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
@RequestMapping("/api/journal")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Journal", description = "Private journal and daily reflections endpoints")
public class JournalController {

    private final JournalEntryRepository journalEntryRepository;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all journal entries for the current user")
    public ResponseEntity<ApiResponse<List<JournalEntryResponse>>> getEntries(Authentication authentication) {
        User user = userService.getCurrentUser(authentication.getName());
        List<JournalEntryResponse> entries = journalEntryRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(JournalEntryResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(entries));
    }

    @PostMapping
    @Operation(summary = "Create a new journal entry")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> createEntry(
            @Valid @RequestBody JournalRequest request,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());

        JournalEntry entry = JournalEntry.builder()
                .user(user)
                .title(request.getTitle())
                .content(request.getContent())
                .moodTag(request.getMoodTag())
                .category(request.getCategory())
                .build();

        JournalEntry saved = journalEntryRepository.save(entry);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Journal entry created", JournalEntryResponse.from(saved)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing journal entry")
    public ResponseEntity<ApiResponse<JournalEntryResponse>> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody JournalRequest request,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());
        JournalEntry entry = journalEntryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", id));

        entry.setTitle(request.getTitle());
        entry.setContent(request.getContent());
        entry.setMoodTag(request.getMoodTag());
        entry.setCategory(request.getCategory());

        JournalEntry saved = journalEntryRepository.save(entry);
        return ResponseEntity.ok(ApiResponse.success("Journal entry updated", JournalEntryResponse.from(saved)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a journal entry")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = userService.getCurrentUser(authentication.getName());
        JournalEntry entry = journalEntryRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", "id", id));

        journalEntryRepository.delete(entry);
        return ResponseEntity.ok(ApiResponse.success("Journal entry deleted", null));
    }
}
