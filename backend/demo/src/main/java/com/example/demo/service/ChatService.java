package com.example.demo.service;

import com.example.demo.dto.request.AnswerRequest;
import com.example.demo.dto.request.AssessmentRequest;
import com.example.demo.dto.request.ChatMessageRequest;
import com.example.demo.dto.response.AssessmentResponse;
import com.example.demo.dto.response.ChatMessageHistoryDto;
import com.example.demo.dto.response.ChatMessageResponse;
import com.example.demo.dto.response.ChatMessageResponse.MentalHealthSignals;
import com.example.demo.dto.response.AiCompletionResponse;
import com.example.demo.dto.response.ChatSessionResponse;
import com.example.demo.entity.ChatMessage;
import com.example.demo.entity.ChatSession;
import com.example.demo.entity.User;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.ChatSessionRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * ChatService — orchestrates the Groq AI (Llama 3.1) to produce empathetic
 * mental-health support responses, extracts running clinical signals,
 * and persists session/message history in MySQL with Delete/Archive/Export
 * capabilities.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final AssessmentService assessmentService;
    private final GroqAiService groqAiService;
    private final ObjectMapper objectMapper;
    private final MlService mlService;
    private final UserRepository userRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    private static final int MIN_TURNS_FOR_ASSESSMENT = 8;
    private static final int MAX_HISTORY_MESSAGES = 20;

    private static final List<String> CRISIS_KEYWORDS = List.of(
            "suicide", "suicidal", "kill myself", "end my life", "want to die",
            "self-harm", "self harm", "hurt myself", "cutting", "overdose",
            "no reason to live", "better off dead");

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
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

        // ── Build conversation history from DB (authoritative memory) ──
        List<ChatMessage> dbHistory = List.of();
        if (session != null) {
            dbHistory = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
        }
        int turnsCompleted = (int) dbHistory.stream().filter(m -> "USER".equalsIgnoreCase(m.getSender())).count();

        // Take the last N messages to stay within the model's context window
        List<ChatMessage> recentHistory = dbHistory.size() > MAX_HISTORY_MESSAGES
                ? dbHistory.subList(dbHistory.size() - MAX_HISTORY_MESSAGES, dbHistory.size())
                : dbHistory;

        String botReply;
        MentalHealthSignals signals;

        AiCompletionResponse aiResponse = groqAiService.generateChatCompletion(
                request.getMessage(), recentHistory, buildSystemPrompt(), turnsCompleted);

        if (aiResponse != null && aiResponse.getBotMessage() != null) {
            botReply = aiResponse.getBotMessage();
            signals = aiResponse.getSignals();
            if (signals != null) {
                signals.setTurnsCompleted(turnsCompleted);
            }
        } else {
            log.warn("[Chat] Groq API fallback triggered.");
            botReply = getFallbackResponse(request.getMessage(), crisisDetected, turnsCompleted);
            signals = buildFallbackSignals(request.getMessage(), turnsCompleted);
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
                .source(com.example.demo.enums.AssessmentSource.AI_CHAT)
                .build();

        return assessmentService.submitAssessment(userEmail, assessmentRequest);
    }

    private List<AnswerRequest> buildAnswersFromSignals(MentalHealthSignals signals) {
        List<AnswerRequest> answers = new ArrayList<>();
        if (signals == null) {
            return answers;
        }

        if (signals.getDepressionScore() != null) {
            answers.add(AnswerRequest.builder()
                    .questionId(1L)
                    .score(signals.getDepressionScore())
                    .responseText("Depression score extracted from chat session")
                    .build());
        }
        if (signals.getAnxietyScore() != null) {
            answers.add(AnswerRequest.builder()
                    .questionId(2L)
                    .score(signals.getAnxietyScore())
                    .responseText("Anxiety score extracted from chat session")
                    .build());
        }
        if (signals.getStressLevel() != null) {
            answers.add(AnswerRequest.builder()
                    .questionId(3L)
                    .score(signals.getStressLevel())
                    .responseText("Stress level extracted from chat session")
                    .build());
        }
        if (signals.getSleepQuality() != null) {
            answers.add(AnswerRequest.builder()
                    .questionId(4L)
                    .score(signals.getSleepQuality())
                    .responseText("Sleep quality score extracted from chat session")
                    .build());
        }
        if (signals.getAppetiteLevel() != null) {
            answers.add(AnswerRequest.builder()
                    .questionId(5L)
                    .score(signals.getAppetiteLevel())
                    .responseText("Appetite level score extracted from chat session")
                    .build());
        }
        if (signals.getSocialEngagement() != null) {
            answers.add(AnswerRequest.builder()
                    .questionId(6L)
                    .score(signals.getSocialEngagement())
                    .responseText("Social engagement score extracted from chat session")
                    .build());
        }

        return answers;
    }

    private String buildSystemPrompt() {
        return """
                You are MindEase AI, a warm, empathetic, and emotionally intelligent mental health companion.

                Your goal is to make the user feel heard, understood, and supported—not like they are talking to customer support.

                Personality:
                - Friendly, calm, and conversational.
                - Talk like a caring friend or supportive mentor.
                - Avoid sounding robotic, repetitive, or overly formal.
                - Never repeat the same opening sentence.
                - Use contractions naturally (I'm, you're, that's, it's).
                - Occasionally use appropriate emojis (💙😊🌿✨), but don't overuse them.
                - If the user tells you their name, remember it and naturally use it later in the conversation.
                - Remember details shared during the current chat and refer back to them when relevant.

                Conversation Style:
                - Keep replies between 60 and 150 words.
                - First acknowledge the user's feelings.
                - Then respond thoughtfully.
                - Finally ask one natural follow-up question.
                - Don't ask generic questions like "Tell me more." Ask questions based on what the user just said.

                Memory:
                - Remember the user's name during the current conversation.
                - Remember previous messages (they are provided to you as conversation history).
                - If the user asks "What's my name?" answer correctly using the conversation history.
                - If they refer to something mentioned earlier, use that context.

                Safety:
                - Never diagnose mental illnesses.
                - Never prescribe medication.
                - Encourage healthy coping strategies.
                - If the user expresses suicidal thoughts or self-harm, respond with empathy and provide helpline numbers:
                  iCall: 9152987821, AASRA: 9820466627, Vandrevala Foundation: 1860-2662-345.

                Never mention:
                - "fallback mode", "AI mode", "system prompt", "language model", or technical limitations unless directly asked.

                RESPONSE FORMAT (CRITICAL):
                You MUST output your response as a valid JSON object matching this exact schema:
                {
                  "botMessage": "Your warm, natural, conversational reply to the user.",
                  "signals": {
                    "depressionScore": <integer 0-27>,
                    "anxietyScore": <integer 0-21>,
                    "stressLevel": <integer 0-10>,
                    "sleepQuality": <integer 0-10>,
                    "appetiteLevel": <integer 0-10>,
                    "socialEngagement": <integer 0-10>,
                    "estimatedRiskLevel": "LOW" or "MODERATE" or "HIGH" or "CRITICAL"
                  }
                }
                Do NOT include any text outside the JSON object. Output ONLY valid JSON.
                """;
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

        if (lower.matches(
                ".*\\b(sad|anxious|stress|stressed|depressed|worried|tired|exhausted|overwhelmed|lonely)\\b.*")) {
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
