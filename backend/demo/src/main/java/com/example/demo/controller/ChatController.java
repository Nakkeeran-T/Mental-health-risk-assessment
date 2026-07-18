package com.example.demo.controller;

import com.example.demo.dto.request.ChatMessageRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.dto.response.ChatMessageResponse;
import com.example.demo.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for the AI Chat feature.
 *
 * Endpoints:
 *  POST /api/chat/message   — send a user message and get the bot reply + signals
 *  POST /api/chat/complete  — finalise session: convert signals → formal assessment
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "AI Chat", description = "Conversational mental health chatbot powered by Google Gemini")
public class ChatController {

    private final ChatService chatService;

    /**
     * POST /api/chat/message
     *
     * Receives the user's message plus conversation history, calls Gemini,
     * and returns the bot reply along with accumulated mental-health signals.
     */
    @PostMapping("/message")
    @Operation(summary = "Send a chat message and receive an AI response with mental health signals")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication
    ) {
        ChatMessageResponse response = chatService.processMessage(request);
        return ResponseEntity.ok(ApiResponse.success("Message processed", response));
    }

    /**
     * POST /api/chat/complete
     *
     * Called when the user clicks "End Session & Get Analysis".
     * Converts the accumulated chat signals into a formal assessment
     * and persists it through the existing AssessmentService.
     *
     * Request body: { "signals": {...}, "conversationSummary": "..." }
     */
    @PostMapping("/complete")
    @Operation(summary = "Complete the chat session and submit mental health assessment")
    public ResponseEntity<ApiResponse<AssessmentResponse>> completeSession(
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        // Parse signals from request body
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
