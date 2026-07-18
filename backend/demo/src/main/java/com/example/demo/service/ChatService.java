package com.example.demo.service;

import com.example.demo.dto.request.AnswerRequest;
import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.request.ChatMessageRequest;
import com.example.demo.dto.request.ChatMessageRequest.ConversationTurn;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.dto.response.ChatMessageResponse;
import com.example.demo.dto.response.ChatMessageResponse.MentalHealthSignals;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * ChatService — orchestrates the Gemini API to produce empathetic
 * mental-health support responses and extracts running clinical signals
 * that can later be submitted as a formal assessment.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final AssessmentService assessmentService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final MlService mlService;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    // Minimum turns before we consider enough data for an assessment
    private static final int MIN_TURNS_FOR_ASSESSMENT = 8;

    // Crisis keywords for immediate detection
    private static final List<String> CRISIS_KEYWORDS = List.of(
            "suicide", "suicidal", "kill myself", "end my life", "want to die",
            "self-harm", "self harm", "hurt myself", "cutting", "overdose",
            "no reason to live", "better off dead"
    );

    // ─────────────────────────────────────────────────────────────────────────
    //  PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Processes a single chat turn: sends the message to Gemini and returns
     * the bot reply along with accumulated mental health signals.
     */
    public ChatMessageResponse processMessage(ChatMessageRequest request) {

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

        boolean assessmentReady = turnsCompleted >= MIN_TURNS_FOR_ASSESSMENT
                && signals != null
                && signals.getDepressionScore() != null;

        return ChatMessageResponse.builder()
                .botMessage(botReply)
                .signals(signals)
                .assessmentReady(assessmentReady)
                .crisisDetected(crisisDetected)
                .sessionId(request.getSessionId())
                .build();
    }

    /**
     * Converts accumulated chat signals into a formal assessment and submits it.
     * Called when the user clicks "End Session & Get Analysis".
     */
    public AssessmentResponse completeSession(MentalHealthSignals signals,
                                               String conversationSummary,
                                               String userEmail) {

        // Detect emotion from conversation summary via NLP
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
    //  GEMINI INTEGRATION
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

        // System instruction as first user turn
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

        // Conversation history
        if (request.getHistory() != null) {
            for (ConversationTurn turn : request.getHistory()) {
                contents.add(Map.of(
                        "role", turn.getRole(),
                        "parts", List.of(Map.of("text", turn.getContent()))
                ));
            }
        }

        // Current user message
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
                    // Split on signals marker and return only the bot message part
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
                        // Extract just the JSON object
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

    // ─────────────────────────────────────────────────────────────────────────
    //  ASSESSMENT MAPPING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Maps chat-derived signals to AnswerRequest objects using the seeded question IDs.
     * PHQ-9 (Q1-Q9): depression, each scored 0-3
     * GAD-7 (Q10-Q16): anxiety, each scored 0-3
     * Stress (Q17-Q20): stress, each scored 0-4
     */
    private List<AnswerRequest> buildAnswersFromSignals(MentalHealthSignals signals) {
        List<AnswerRequest> answers = new ArrayList<>();

        // Distribute depression score (0-27) across 9 PHQ-9 questions
        int depressionScore = orDefault(signals.getDepressionScore(), 0);
        int perDepressionQ = Math.min(3, depressionScore / 9);
        for (long qId = 1; qId <= 9; qId++) {
            answers.add(AnswerRequest.builder()
                    .questionId(qId)
                    .score(clamp(perDepressionQ, 0, 3))
                    .responseText("Derived from conversational chat assessment")
                    .build());
        }

        // Distribute anxiety score (0-21) across 7 GAD-7 questions
        int anxietyScore = orDefault(signals.getAnxietyScore(), 0);
        int perAnxietyQ = Math.min(3, anxietyScore / 7);
        for (long qId = 10; qId <= 16; qId++) {
            answers.add(AnswerRequest.builder()
                    .questionId(qId)
                    .score(clamp(perAnxietyQ, 0, 3))
                    .responseText("Derived from conversational chat assessment")
                    .build());
        }

        // Distribute stress score (0-10) across 4 Stress questions
        int stressLevel = orDefault(signals.getStressLevel(), 0);
        int perStressQ = Math.min(4, (int) Math.round(stressLevel * 4.0 / 10.0));
        for (long qId = 17; qId <= 20; qId++) {
            answers.add(AnswerRequest.builder()
                    .questionId(qId)
                    .score(clamp(perStressQ, 0, 4))
                    .responseText("Derived from conversational chat assessment")
                    .build());
        }

        return answers;
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  FALLBACK (no API key)
    // ─────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────
    //  UTILITIES
    // ─────────────────────────────────────────────────────────────────────────

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

    private int orDefault(Integer val, int def) {
        return val == null ? def : val;
    }

    private int clamp(int val, int min, int max) {
        return Math.max(min, Math.min(max, val));
    }
}
