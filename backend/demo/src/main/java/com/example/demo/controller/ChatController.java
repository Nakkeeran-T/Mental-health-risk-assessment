package com.example.demo.controller;

import com.example.demo.dto.request.ChatMessageRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.dto.response.ChatMessageHistoryDto;
import com.example.demo.dto.response.ChatMessageResponse;
import com.example.demo.dto.response.ChatSessionResponse;
import com.example.demo.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for the AI Chat feature, Chat History, and Session Management.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Chat", description = "Conversational mental health chatbot with history, delete, archive, and share export features")
public class ChatController {

    private final ChatService chatService;

    @PostMapping("/message")
    @Operation(summary = "Send a chat message and receive an AI response with mental health signals")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication
    ) {
        String userEmail = authentication != null ? authentication.getName() : null;
        ChatMessageResponse response = chatService.processMessage(request, userEmail);
        return ResponseEntity.ok(ApiResponse.success("Message processed", response));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Get all non-deleted chat sessions for the logged-in user")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> getUserSessions(
            Authentication authentication
    ) {
        List<ChatSessionResponse> sessions = chatService.getUserSessions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("User chat sessions retrieved", sessions));
    }

    @GetMapping("/sessions/{sessionId}")
    @Operation(summary = "Get message history for a specific chat session")
    public ResponseEntity<ApiResponse<List<ChatMessageHistoryDto>>> getSessionMessages(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        List<ChatMessageHistoryDto> history = chatService.getSessionMessages(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Session messages retrieved", history));
    }

    @PostMapping("/sessions/new")
    @Operation(summary = "Start a fresh new chat session")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> startNewSession(
            Authentication authentication
    ) {
        ChatSessionResponse session = chatService.startNewSession(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("New chat session started", session));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Delete a chat session")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        chatService.deleteSession(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Session deleted successfully", null));
    }

    @PutMapping("/sessions/{sessionId}/archive")
    @Operation(summary = "Archive or unarchive a chat session")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> toggleArchiveSession(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        ChatSessionResponse updated = chatService.toggleArchiveSession(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Session status updated", updated));
    }

    @GetMapping("/sessions/{sessionId}/export")
    @Operation(summary = "Export formatted transcript text for sharing")
    public ResponseEntity<ApiResponse<String>> exportTranscript(
            @PathVariable String sessionId,
            Authentication authentication
    ) {
        String transcript = chatService.exportTranscript(sessionId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Transcript generated", transcript));
    }

    @PostMapping("/complete")
    @Operation(summary = "Complete the chat session and submit mental health assessment")
    public ResponseEntity<ApiResponse<AssessmentResponse>> completeSession(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        ChatMessageResponse.MentalHealthSignals signals = parseSignals(body);
        String summary = (String) body.getOrDefault("conversationSummary", "AI Chat session completed.");

        AssessmentResponse assessment = chatService.completeSession(signals, summary, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assessment created from chat session", assessment));
    }

    private ChatMessageResponse.MentalHealthSignals parseSignals(Map<String, Object> body) {
        Object rawSignals = body.get("signals");
        if (rawSignals instanceof Map<?, ?> signalsMap) {
            return ChatMessageResponse.MentalHealthSignals.builder()
                    .depressionScore(toInt(signalsMap.get("depressionScore")))
                    .anxietyScore(toInt(signalsMap.get("anxietyScore")))
                    .stressLevel(toInt(signalsMap.get("stressLevel")))
                    .sleepQuality(toInt(signalsMap.get("sleepQuality")))
                    .appetiteLevel(toInt(signalsMap.get("appetiteLevel")))
                    .socialEngagement(toInt(signalsMap.get("socialEngagement")))
                    .estimatedRiskLevel(rawSignals != null ? (String) ((Map<?,?>) rawSignals).get("estimatedRiskLevel") : null)
                    .build();
        }
        return ChatMessageResponse.MentalHealthSignals.builder().build();
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return null; }
    }
}
