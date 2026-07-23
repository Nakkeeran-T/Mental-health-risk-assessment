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
 * and persists session/message history in MySQL with Delete/Archive/Export
 * capabilities.
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

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final int MIN_TURNS_FOR_ASSESSMENT = 8;

    private static final List<String> CRISIS_KEYWORDS = List.of(
            "suicide", "suicidal", "kill myself", "end my life", "want to die",
            "self-harm", "self harm", "hurt myself", "cutting", "overdose",
            "no reason to live", "better off dead");

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    private String getEffectiveApiKey() {
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return geminiApiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey.trim();
        }
        return null;
    }

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
        String activeApiKey = getEffectiveApiKey();

        if (activeApiKey == null || activeApiKey.isBlank()) {
            log.info("[Chat] Gemini API key not found. Using dynamic fallback mode.");
            botReply = getFallbackResponse(request.getMessage(), crisisDetected, turnsCompleted);
            signals = buildFallbackSignals(request.getMessage(), turnsCompleted);
        } else {
            String geminiRaw = callGemini(request, activeApiKey);
            botReply = extractBotMessage(geminiRaw);
            signals = extractSignals(geminiRaw, turnsCompleted);
            if (botReply == null || botReply.equals(getDefaultBotMessage())) {
                log.warn("[Chat] Gemini response extraction fallback triggered.");
                if (geminiRaw == null) {
                    botReply = getFallbackResponse(request.getMessage(), crisisDetected, turnsCompleted);
                    signals = buildFallbackSignals(request.getMessage(), turnsCompleted);
                }
            }
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

        List<ChatSession> sessions = chatSessionRepository.findByUserIdAndStatusNotOrderByUpdatedAtDesc(user.getId(),
                "DELETED");

        return sessions.stream().map(s -> {
            List<ChatMessage> msgs = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(s.getId());
            return ChatSessionResponse.builder()
                    .id(s.getId())
                    .sessionId(s.getSessionId())
                    .title(s.getTitle() != null && !s.getTitle().isBlank() ? s.getTitle()
                            : "Conversation " + s.getSessionId().substring(0, 8))
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
                .build()).collect(Collectors.toList());
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
        String notes = "[AI_CHAT] " + conversationSummary
                + (mlEmotion != null ? " | Detected emotion: " + mlEmotion : "");

        AssessmentRequest assessmentRequest = AssessmentRequest.builder()
                .answers(answers)
                .notes(notes)
                .build();

        return assessmentService.submitAssessment(userEmail, assessmentRequest);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GEMINI INTEGRATION & UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

    private String callGemini(ChatMessageRequest request, String apiKey) {
        String systemPrompt = buildSystemPrompt();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("system_instruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))));

        List<Map<String, Object>> contents = new ArrayList<>();

        if (request.getHistory() != null) {
            for (ConversationTurn turn : request.getHistory()) {
                String role = "user".equalsIgnoreCase(turn.getRole()) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", turn.getContent()))));
            }
        }

        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", request.getMessage()))));

        body.put("contents", contents);
        body.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 1000));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            log.info("[Chat] Sending request to Gemini API (Active Key Present)...");
            ResponseEntity<String> response = restTemplate.postForEntity(
                    GEMINI_URL + apiKey, entity, String.class);

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
                You are MindEase AI, an advanced, highly specialized Mental Health & Psychological Wellbeing Companion integrated into the MindEase Mental Health Risk Assessment Platform.
                Your core purpose is to provide compassionate, evidence-informed emotional support, conduct background risk evaluation, and guide users toward mental wellness.

                CLINICAL & DOMAIN KNOWLEDGE BASE:
                - Evaluation Frameworks: You understand PHQ-9 (Depression Screening: 0-27), GAD-7 (Anxiety Screening: 0-21), and PSS (Perceived Stress Scale: 0-10).
                - Evidence-Based Techniques: You utilize Cognitive Behavioral Therapy (CBT) thought reframing, 5-4-3-2-1 grounding techniques, box breathing exercises, sleep hygiene strategies, and mindfulness practices.
                - Crisis Safety: If any indication of self-harm, suicidal ideation, or extreme distress is detected, immediately prioritize safety by providing helpline numbers (iCall: 9152987821, AASRA: 9820466627, Vandrevala Foundation: 1860-2662-345) and warm crisis support.

                CONVERSATIONAL GUIDELINES:
                - Be warm, highly empathetic, non-judgmental, and engaging (like ChatGPT/Gemini trained in mental health).
                - Answer user questions thoughtfully, discuss psychological concepts in simple language, and provide actionable coping strategies.
                - NEVER repeat fixed questions or force rigid questionnaire behavior.
                - Seamlessly evaluate mood, anxiety, stress, sleep quality, appetite, and social engagement during natural dialogue.

                RESPONSE FORMAT (CRITICAL — always include both parts):
                Your response MUST have two sections separated by the exact marker "---SIGNALS---":

                1. The conversational reply to the user (warm, empathetic, evidence-informed text).
                2. A JSON object containing updated mental health signal estimates based on the conversation history.

                Example format:
                It sounds like you're carrying a heavy burden with work stress and poor sleep. When anxiety peaks at night, trying a quick 4-7-8 breathing exercise can help calm your nervous system. Here is how it works...

                ---SIGNALS---
                {"depressionScore": 6, "anxietyScore": 8, "stressLevel": 7, "sleepQuality": 4, "appetiteLevel": 6, "socialEngagement": 5, "estimatedRiskLevel": "MODERATE"}

                Signal extraction rules:
                - depressionScore: 0-27 cumulative (PHQ-9 scale)
                - anxietyScore: 0-21 cumulative (GAD-7 scale)
                - stressLevel: 0-10 (10 = extreme stress)
                - sleepQuality: 0-10 (10 = excellent sleep)
                - appetiteLevel: 0-10 (10 = healthy appetite)
                - socialEngagement: 0-10 (10 = fully socially engaged)
                - estimatedRiskLevel: one of "LOW", "MODERATE", "HIGH", "CRITICAL"
                """;
    }

    private String extractBotMessage(String geminiRaw) {
        if (geminiRaw == null)
            return getDefaultBotMessage();
        try {
            Map<String, Object> parsed = objectMapper.readValue(geminiRaw, new TypeReference<>() {
            });
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
        if (geminiRaw == null)
            return null;
        try {
            Map<String, Object> parsed = objectMapper.readValue(geminiRaw, new TypeReference<>() {
            });
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
                            Map<String, Object> signalMap = objectMapper.readValue(jsonPart, new TypeReference<>() {
                            });
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

        String lower = message != null ? message.toLowerCase() : "";

        if (lower.matches(".*\\b(hi|hello|hey|greetings|good morning|good evening)\\b.*")) {
            return "Hello! I'm MindEase, your AI companion. I'm here to listen, answer your questions, or chat about anything on your mind. How can I help you today?";
        }

        if (lower.contains("?") || lower.matches(".*\\b(what|how|why|can you|could you|explain|tell me|who)\\b.*")) {
            return "That's a great question! While operating in local fallback mode, I can listen and offer general guidance. What aspect of this would you like to discuss further?";
        }

        if (lower.matches(".*\\b(sad|anxious|stress|stressed|depressed|worried|tired|exhausted|overwhelmed|lonely)\\b.*")) {
            return "Thank you for sharing how you're feeling. Dealing with that can be really heavy and challenging. I'm here to support you — what do you think is contributing most to how you're feeling right now?";
        }

        return "I'm listening closely. Thank you for opening up — please tell me more about what's on your mind or how I can best support you right now.";
    }

    private MentalHealthSignals buildFallbackSignals(String message, int turns) {
        String lower = message != null ? message.toLowerCase() : "";
        int depression = 0, anxiety = 0, stress = 5;
        int sleep = 7, appetite = 7, social = 7;

        if (lower.contains("sad") || lower.contains("depress") || lower.contains("hopeless"))
            depression += 5;
        if (lower.contains("anxious") || lower.contains("worry") || lower.contains("panic"))
            anxiety += 5;
        if (lower.contains("stress") || lower.contains("overwhelm"))
            stress += 2;
        if (lower.contains("can't sleep") || lower.contains("insomnia"))
            sleep -= 3;
        if (lower.contains("not eating") || lower.contains("no appetite"))
            appetite -= 3;
        if (lower.contains("alone") || lower.contains("isolated") || lower.contains("withdrawn"))
            social -= 3;

        String riskLevel = "LOW";
        if (depression > 10 || anxiety > 10)
            riskLevel = "MODERATE";
        if (depression > 15 || anxiety > 15)
            riskLevel = "HIGH";
        if (depression > 20 || anxiety > 18)
            riskLevel = "CRITICAL";

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
        if (message == null)
            return false;
        String lower = message.toLowerCase();
        return CRISIS_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private String getDefaultBotMessage() {
        return "I'm here and I'm listening. Could you tell me a bit more about how you've been feeling recently?";
    }

    private Integer toInt(Object val) {
        if (val == null)
            return null;
        if (val instanceof Integer i)
            return i;
        if (val instanceof Number n)
            return n.intValue();
        try {
            return Integer.parseInt(val.toString());
        } catch (Exception e) {
            return null;
        }
    }

    private String toString(Object val) {
        return val == null ? null : val.toString();
    }
}
