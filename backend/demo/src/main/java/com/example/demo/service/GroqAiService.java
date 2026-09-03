package com.example.demo.service;

import com.example.demo.dto.response.AiCompletionResponse;
import com.example.demo.entity.ChatMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroqAiService {

    private final ObjectMapper objectMapper;
    private RestTemplate restTemplate;

    @Value("${groq.api.key:${GROQ_API_KEY:}}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL_NAME = "groq/compound-mini";
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 2000; // 2 seconds

    @PostConstruct
    public void init() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); // 5 seconds
        factory.setReadTimeout(15000); // 15 seconds
        this.restTemplate = new RestTemplate(factory);
    }

    private String getEffectiveApiKey() {
        if (groqApiKey != null && !groqApiKey.isBlank()) {
            return groqApiKey.trim();
        }
        String envKey = System.getenv("GROQ_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey.trim();
        }
        return null;
    }

    /**
     * Generate a chat completion using Groq API with DB-backed conversation history.
     *
     * @param currentMessage the user's latest message
     * @param dbHistory      recent ChatMessage entities from the database (already includes the current user message)
     * @param systemPrompt   the system prompt defining the bot's personality
     * @param turnsCompleted number of user turns completed so far
     * @return parsed AI response, or null if the call fails after retries
     */
    public AiCompletionResponse generateChatCompletion(String currentMessage, List<ChatMessage> dbHistory,
                                                        String systemPrompt, int turnsCompleted) {
        String apiKey = getEffectiveApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("[GroqAiService] Groq API key is missing. Returning null to trigger fallback.");
            return null;
        }

        Map<String, Object> body = buildRequestBody(currentMessage, dbHistory, systemPrompt);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        int attempt = 0;
        while (attempt < MAX_RETRIES) {
            try {
                attempt++;
                log.info("[GroqAiService] Calling Groq API (Attempt {}/{}, history_size={})",
                        attempt, MAX_RETRIES, dbHistory.size());
                ResponseEntity<String> response = restTemplate.postForEntity(GROQ_URL, entity, String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    return parseResponse(response.getBody());
                } else {
                    log.warn("[GroqAiService] Unexpected status code: {}", response.getStatusCode());
                }
            } catch (RestClientException e) {
                log.error("[GroqAiService] Error calling Groq API: {}", e.getMessage());
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }
        
        log.error("[GroqAiService] Failed to generate response after {} attempts.", MAX_RETRIES);
        return null;
    }

    /**
     * Build the OpenAI-compatible request body using DB history as the conversation context.
     * This ensures the model has full memory of the current session.
     */
    private Map<String, Object> buildRequestBody(String currentMessage, List<ChatMessage> dbHistory,
                                                  String systemPrompt) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL_NAME);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Add conversation history from database (authoritative memory)
        for (ChatMessage msg : dbHistory) {
            String role = "USER".equalsIgnoreCase(msg.getSender()) ? "user" : "assistant";
            messages.add(Map.of("role", role, "content", msg.getContent()));
        }

        body.put("messages", messages);

        // Force JSON output
        body.put("response_format", Map.of("type", "json_object"));
        
        // Generation params
        body.put("temperature", 0.7);
        body.put("max_tokens", 1000);

        return body;
    }


    private AiCompletionResponse parseResponse(String responseBody) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(responseBody, Map.class);
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) parsed.get("choices");
            
            if (choices != null && !choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                if (message != null) {
                    String content = (String) message.get("content");
                    if (content != null && !content.isBlank()) {
                        // Strip any markdown code fences (e.g. ```json ... ```)
                        String cleanedContent = content
                                .replaceAll("(?s)^```(?:json)?\\s*", "")
                                .replaceAll("(?s)\\s*```$", "")
                                .trim();
                        return objectMapper.readValue(cleanedContent, AiCompletionResponse.class);
                    }
                }
            }
        } catch (Exception e) {
            log.error("[GroqAiService] Failed to parse Groq response: {}", e.getMessage());
        }
        return null;
    }
}
