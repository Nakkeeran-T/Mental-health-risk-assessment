package com.example.demo.service;

import com.example.demo.dto.request.AnswerRequest;
import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.request.ChatMessageRequest;
import com.example.demo.dto.request.ChatMessageRequest.ConversationTurn;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.dto.response.ChatMessageHistoryDto;
import com.example.demo.dto.response.ChatMessageResponse;
import com.example.demo.dto.response.ChatMessageResponse.MentalHealthSignals;
import com.example.demo.dto.response.ChatSessionResponse;
import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.ChatSession;
import com.example.demo.entity.User;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ChatSessionRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * ChatService — orchestrates the Gemini API to produce empathetic
 * mental-health support responses, extracts running clinical signals,
 * and persists session/message history in MySQL with Delete/Archive/Export capabilities.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final AssessmentService assessmentService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final MlService mlService;
    private final UserRepository userRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final int MIN_TURNS_FOR_ASSESSMENT = 8;

    private static final List<String> CRISIS_KEYWORDS = List.of(
            "suicide", "suicidal", "kill myself", "end my life", "want to die",
            "self-harm", "self harm", "hurt myself", "cutting", "overdose",
            "no reason to live", "better off dead"
    );

    // ─────────────────────────────────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public ChatMessageResponse processMessage(ChatMessageRequest request, String userEmail) {
        User user = null;
        if (userEmail != null && !userEmail.isBlank()) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.isBlank()) {
            sessionId = UUID.randomUUID().toString();
        }

        ChatSession session = null;
        if (user != null) {
            final User finalUser = user;
            final String finalSessionId = sessionId;
            session = chatSessionRepository.findBySessionId(finalSessionId)
                    .orElseGet(() -> {
                        String title = request.getMessage().length() > 40
                                ? request.getMessage().substring(0, 40) + "..."
                                : request.getMessage();
                        ChatSession newSession = ChatSession.builder()
                                .user(finalUser)
                                .sessionId(finalSessionId)
                                .title(title)
                                .status("ACTIVE")
                                .build();
                        return chatSessionRepository.save(newSession);
                    });
        }

        if (session != null) {
            ChatMessage userMsg = ChatMessage.builder()
                    .chatSession(session)
                    .sender("USER")
                    .content(request.getMessage())
                    .build();
            chatMessageRepository.save(userMsg);
        }

        boolean crisisDetected = detectCrisis(request.getMessage());
        int turnsCompleted = (request.getHistory() == null ? 0 : request.getHistory().size() / 2) + 1;

        String botReply;
        MentalHealthSignals signals;

        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            botReply = getFallbackResponse(request.getMessage(), crisisDetected, turnsCompleted);
            signals = buildFallbackSignals(request.getMessage(), turnsCompleted);
        } else {
            String geminiRaw = callGemini(request);
            botReply = extractBotMessage(geminiRaw);
            signals = extractSignals(geminiRaw, turnsCompleted);
        }

        if (session != null) {
            String signalsJsonStr = null;
            try {
                if (signals != null) {
                    signalsJsonStr = objectMapper.writeValueAsString(signals);
                }
            } catch (Exception e) {
                log.warn("[Chat] Failed to serialize signals JSON: {}", e.getMessage());
            }

            ChatMessage botMsg = ChatMessage.builder()
                    .chatSession(session)
                    .sender("BOT")
                    .content(botReply)
                    .signalsJson(signalsJsonStr)
                    .build();
            chatMessageRepository.save(botMsg);
        }

        boolean assessmentReady = turnsCompleted >= MIN_TURNS_FOR_ASSESSMENT
                && signals != null
                && signals.getDepressionScore() != null;

        return ChatMessageResponse.builder()
                .botMessage(botReply)
                .signals(signals)
                .assessmentReady(assessmentReady)
                .crisisDetected(crisisDetected)
                .sessionId(sessionId)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getUserSessions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        List<ChatSession> sessions = chatSessionRepository.findByUserIdAndStatusNotOrderByUpdatedAtDesc(user.getId(), "DELETED");

        return sessions.stream().map(s -> {
            List<ChatMessage> msgs = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(s.getId());
            return ChatSessionResponse.builder()
                    .id(s.getId())
                    .sessionId(s.getSessionId())
                    .title(s.getTitle() != null && !s.getTitle().isBlank() ? s.getTitle() : "Conversation " + s.getSessionId().substring(0, 8))
                    .status(s.getStatus())
                    .createdAt(s.getCreatedAt())
                    .updatedAt(s.getUpdatedAt())
                    .messageCount(msgs.size())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChatMessageHistoryDto> getSessionMessages(String sessionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        ChatSession session = chatSessionRepository.findBySessionIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new RuntimeException("Session not found or access denied: " + sessionId));

        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());

        return messages.stream().map(m -> ChatMessageHistoryDto.builder()
                .id(m.getId())
                .sender(m.getSender())
                .content(m.getContent())
                .timestamp(m.getCreatedAt())
                .signalsJson(m.getSignalsJson())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public ChatSessionResponse startNewSession(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        String sessionId = UUID.randomUUID().toString();
        ChatSession newSession = ChatSession.builder()
                .user(user)
                .sessionId(sessionId)
                .title("New Therapy Chat")
                .status("ACTIVE")
                .build();

        ChatSession saved = chatSessionRepository.save(newSession);

        return ChatSessionResponse.builder()
                .id(saved.getId())
                .sessionId(saved.getSessionId())
                .title(saved.getTitle())
                .status(saved.getStatus())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .messageCount(0)
                .build();
    }

    @Transactional
    public void deleteSession(String sessionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        ChatSession session = chatSessionRepository.findBySessionIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        session.setStatus("DELETED");
        chatSessionRepository.save(session);
    }

    @Transactional
    public ChatSessionResponse toggleArchiveSession(String sessionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        ChatSession session = chatSessionRepository.findBySessionIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        if ("ARCHIVED".equalsIgnoreCase(session.getStatus())) {
            session.setStatus("ACTIVE");
        } else {
            session.setStatus("ARCHIVED");
        }
        ChatSession saved = chatSessionRepository.save(session);

        List<ChatMessage> msgs = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(saved.getId());
        return ChatSessionResponse.builder()
                .id(saved.getId())
                .sessionId(saved.getSessionId())
                .title(saved.getTitle())
                .status(saved.getStatus())
                .createdAt(saved.getCreatedAt())
                .updatedAt(saved.getUpdatedAt())
                .messageCount(msgs.size())
                .build();
    }

    @Transactional(readOnly = true)
    public String exportTranscript(String sessionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));
        ChatSession session = chatSessionRepository.findBySessionIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new RuntimeException("Session not found: " + sessionId));

        List<ChatMessage> messages = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());

        StringBuilder sb = new StringBuilder();
        sb.append("=========================================\n");
        sb.append("   MindEase AI Therapy Chat Transcript   \n");
        sb.append("=========================================\n");
        sb.append("Session Title: ").append(session.getTitle()).append("\n");
        sb.append("Session ID:    ").append(session.getSessionId()).append("\n");
        sb.append("Date:          ").append(session.getCreatedAt()).append("\n\n");
        sb.append("--- Conversation History ---\n\n");

        for (ChatMessage msg : messages) {
            String senderName = "USER".equalsIgnoreCase(msg.getSender()) ? "User" : "MindEase AI";
            sb.append("[").append(senderName).append("]\n");
            sb.append(msg.getContent()).append("\n\n");
        }

        sb.append("=========================================\n");
        sb.append("End of Transcript\n");
        return sb.toString();
    }

    @Transactional
    public AssessmentResponse completeSession(MentalHealthSignals signals,
                                               String conversationSummary,
                                               String userEmail) {

        String mlEmotion = null;
        try {
            MlService.MlEmotionResult emotionResult = mlService.analyzeEmotion(conversationSummary);
            if (emotionResult != null) {
                mlEmotion = emotionResult.emotion();
                log.info("[Chat] Session emotion detected: {} ({:.0%})", mlEmotion, emotionResult.confidence());
            }
        } catch (Exception e) {
            log.warn("[Chat] Emotion analysis failed: {}", e.getMessage());
        }

        List<AnswerRequest> answers = buildAnswersFromSignals(signals);
        String notes = "[AI_CHAT] " + conversationSummary + (mlEmotion != null ? " | Detected emotion: " + mlEmotion : "");

        AssessmentRequest assessmentRequest = AssessmentRequest.builder()
                .answers(answers)
                .notes(notes)
                .build();

        return assessmentService.submitAssessment(userEmail, assessmentRequest);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  GEMINI INTEGRATION & UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private String callGemini(ChatMessageRequest request) {
        String systemPrompt = buildSystemPrompt();
        List<Map<String, Object>> contents = buildContents(request, systemPrompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("contents", contents);
        body.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 800
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_URL + geminiApiKey, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage());
        }
        return null;
    }

    private String buildSystemPrompt() {
        return """
You are MindEase, a compassionate AI mental health support companion.
Your goal is to have a natural, empathetic conversation that gently explores the user's emotional wellbeing.

CONVERSATION RULES:
- Be warm, non-judgmental, and supportive at all times
- Ask one open-ended question at a time — never overwhelm the user
- Reflect what the user says before asking the next question
- Explore these dimensions naturally over the course of the conversation:
  * Mood and emotional state (depression signals)
  * Anxiety and worry levels
  * Sleep quality and patterns
  * Energy and appetite
  * Ability to concentrate
  * Social connections and withdrawal
  * Stress from work, relationships, or life events
- If the user mentions self-harm or suicidal thoughts, immediately provide crisis resources and compassionate support

RESPONSE FORMAT (CRITICAL — always include both parts):
Your response MUST have two sections separated by the exact marker "---SIGNALS---":

1. The conversational reply to the user (natural, warm text)
2. A JSON object with extracted mental health signals

Example format:
I hear you, and it takes real courage to share that. Sleep difficulties can really affect how we feel day to day...

---SIGNALS---
{"depressionScore": 8, "anxietyScore": 5, "stressLevel": 6, "sleepQuality": 3, "appetiteLevel": 7, "socialEngagement": 5, "estimatedRiskLevel": "MODERATE"}

Signal extraction rules:
- depressionScore: 0-27 cumulative (PHQ-9 scale)
- anxietyScore: 0-21 cumulative (GAD-7 scale)
- stressLevel: 0-10 (10 = extreme stress)
- sleepQuality: 0-10 (10 = excellent sleep)
- appetiteLevel: 0-10 (10 = healthy appetite)
- socialEngagement: 0-10 (10 = fully socially engaged)
- estimatedRiskLevel: one of "LOW", "MODERATE", "HIGH", "CRITICAL"

Always update signals based on ALL conversation history, not just the latest message.
If not enough info yet, use null for unknown fields.
""";
    }

    private List<Map<String, Object>> buildContents(ChatMessageRequest request, String systemPrompt) {
        List<Map<String, Object>> contents = new ArrayList<>();

        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", systemPrompt))
        ));
        contents.add(Map.of(
                "role", "model",
                "parts", List.of(Map.of("text",
                        "Understood. I'm MindEase, ready to have a compassionate, supportive conversation. " +
                        "I'll follow all the rules and always include the ---SIGNALS--- section in my responses."))
        ));

        if (request.getHistory() != null) {
            for (ConversationTurn turn : request.getHistory()) {
                contents.add(Map.of(
                        "role", turn.getRole(),
                        "parts", List.of(Map.of("text", turn.getContent()))
                ));
            }
        }

        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.getMessage()))
        ));

        return contents;
    }

    private String extractBotMessage(String geminiRaw) {
        if (geminiRaw == null) return getDefaultBotMessage();
        try {
            Map<String, Object> parsed = objectMapper.readValue(geminiRaw, new TypeReference<>() {});
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) parsed.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    String fullText = (String) parts.get(0).get("text");
                    if (fullText != null && fullText.contains("---SIGNALS---")) {
                        return fullText.split("---SIGNALS---")[0].trim();
                    }
                    return fullText != null ? fullText.trim() : getDefaultBotMessage();
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse Gemini response for bot message: {}", e.getMessage());
        }
        return getDefaultBotMessage();
    }

    private MentalHealthSignals extractSignals(String geminiRaw, int turnsCompleted) {
        if (geminiRaw == null) return null;
        try {
            Map<String, Object> parsed = objectMapper.readValue(geminiRaw, new TypeReference<>() {});
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) parsed.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    String fullText = (String) parts.get(0).get("text");
                    if (fullText != null && fullText.contains("---SIGNALS---")) {
                        String jsonPart = fullText.split("---SIGNALS---")[1].trim();
                        int start = jsonPart.indexOf('{');
                        int end = jsonPart.lastIndexOf('}');
                        if (start >= 0 && end > start) {
                            jsonPart = jsonPart.substring(start, end + 1);
                            @SuppressWarnings("unchecked")
                            Map<String, Object> signalMap = objectMapper.readValue(jsonPart, new TypeReference<>() {});
                            return MentalHealthSignals.builder()
                                    .depressionScore(toInt(signalMap.get("depressionScore")))
                                    .anxietyScore(toInt(signalMap.get("anxietyScore")))
                                    .stressLevel(toInt(signalMap.get("stressLevel")))
                                    .sleepQuality(toInt(signalMap.get("sleepQuality")))
                                    .appetiteLevel(toInt(signalMap.get("appetiteLevel")))
                                    .socialEngagement(toInt(signalMap.get("socialEngagement")))
                                    .estimatedRiskLevel(toString(signalMap.get("estimatedRiskLevel")))
                                    .turnsCompleted(turnsCompleted)
                                    .build();
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract signals from Gemini response: {}", e.getMessage());
        }
        return MentalHealthSignals.builder().turnsCompleted(turnsCompleted).build();
    }

    private String getFallbackResponse(String message, boolean crisis, int turns) {
        if (crisis) {
            return "I hear that you're going through something really difficult right now. " +
                   "Please reach out to a crisis helpline immediately — iCall: 9152987821 or " +
                   "Vandrevala Foundation: 1860-2662-345. You are not alone, and help is available.";
        }
        String[] empathyStarters = {
            "Thank you for sharing that with me. ",
            "I appreciate you opening up. ",
            "That sounds really challenging. ",
            "I understand, and I'm here for you. "
        };
        String starter = empathyStarters[turns % empathyStarters.length];

        String[] followUps = {
            "Can you tell me more about how you've been sleeping lately?",
            "How has your energy been during the day?",
            "Have you been able to do things that usually bring you joy?",
            "How are your relationships with people close to you?",
            "Have you noticed changes in your appetite recently?",
            "How often do you feel overwhelmed by worry?",
            "What does your stress level feel like on a scale of 1 to 10?",
            "How are you coping with day-to-day responsibilities?"
        };
        String followUp = followUps[turns % followUps.length];
        return starter + followUp;
    }

    private MentalHealthSignals buildFallbackSignals(String message, int turns) {
        String lower = message.toLowerCase();
        int depression = 0, anxiety = 0, stress = 5;
        int sleep = 7, appetite = 7, social = 7;

        if (lower.contains("sad") || lower.contains("depress") || lower.contains("hopeless")) depression += 5;
        if (lower.contains("anxious") || lower.contains("worry") || lower.contains("panic")) anxiety += 5;
        if (lower.contains("stress") || lower.contains("overwhelm")) stress += 2;
        if (lower.contains("can't sleep") || lower.contains("insomnia")) sleep -= 3;
        if (lower.contains("not eating") || lower.contains("no appetite")) appetite -= 3;
        if (lower.contains("alone") || lower.contains("isolated") || lower.contains("withdrawn")) social -= 3;

        String riskLevel = "LOW";
        if (depression > 10 || anxiety > 10) riskLevel = "MODERATE";
        if (depression > 15 || anxiety > 15) riskLevel = "HIGH";
        if (depression > 20 || anxiety > 18) riskLevel = "CRITICAL";

        return MentalHealthSignals.builder()
                .depressionScore(depression)
                .anxietyScore(anxiety)
                .stressLevel(Math.min(10, stress))
                .sleepQuality(Math.max(0, sleep))
                .appetiteLevel(Math.max(0, appetite))
                .socialEngagement(Math.max(0, social))
                .estimatedRiskLevel(riskLevel)
                .turnsCompleted(turns)
                .build();
    }

    private boolean detectCrisis(String message) {
        if (message == null) return false;
        String lower = message.toLowerCase();
        return CRISIS_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private String getDefaultBotMessage() {
        return "I'm here and I'm listening. Could you tell me a bit more about how you've been feeling recently?";
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return null; }
    }

    private String toString(Object val) {
        return val == null ? null : val.toString();
    }
}
