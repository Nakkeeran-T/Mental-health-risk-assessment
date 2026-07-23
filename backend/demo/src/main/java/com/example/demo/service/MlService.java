package com.example.demo.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * MlService — HTTP client that calls the Python FastAPI ML microservice.
 *
 * All methods silently return null / empty results when the ML service is
 * unreachable, allowing callers to fall back to rule-based logic.
 *
 * Endpoints consumed:
 *   POST /ml/risk-predict     → XGBoost risk classification
 *   POST /ml/emotion-analyze  → HuggingFace NLP emotion detection
 *   POST /ml/mood-forecast    → OLS linear regression mood forecast
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MlService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    // ── DTOs (inner records for clean usage) ──────────────────────────────────

    public record MlRiskResult(
            String riskLevel,
            Double confidence,
            Map<String, Double> allProbabilities,
            Map<String, Double> featureImportance,
            Map<String, Double> shapValues
    ) {}

    public record MlEmotionResult(
            String emotion,
            Double confidence,
            Map<String, Double> allScores,
            String source
    ) {}

    public record MlMoodResult(
            Double predictedScore,
            String trend,
            Double slope,
            Boolean alert,
            Integer dataPointsUsed,
            String message
    ) {}

    // ── Risk Prediction (XGBoost) ─────────────────────────────────────────────

    /**
     * Calls /ml/risk-predict with all 6 clinical features.
     *
     * @param depression       PHQ-9 total (0–27)
     * @param anxiety          GAD-7 total (0–21)
     * @param stress           Stress level (0–10)
     * @param sleepQuality     Sleep quality (0–10)
     * @param socialEngagement Social engagement (0–10)
     * @param appetiteLevel    Appetite level (0–10)
     * @return XGBoost result with risk level + confidence + SHAP, or null if unavailable
     */
    public MlRiskResult predictRisk(int depression, int anxiety, int stress,
                                    int sleepQuality, int socialEngagement, int appetiteLevel) {
        try {
            Map<String, Object> body = Map.of(
                    "depression",        depression,
                    "anxiety",           anxiety,
                    "stress",            stress,
                    "sleep_quality",     sleepQuality,
                    "social_engagement", socialEngagement,
                    "appetite_level",    appetiteLevel
            );

            ResponseEntity<String> response = post("/ml/risk-predict", body);
            if (response == null || !response.getStatusCode().is2xxSuccessful()) return null;

            Map<String, Object> parsed = objectMapper.readValue(
                    response.getBody(), new TypeReference<>() {}
            );

            return new MlRiskResult(
                    (String) parsed.get("risk_level"),
                    toDouble(parsed.get("confidence")),
                    toDoubleMap(parsed.get("all_probabilities")),
                    toDoubleMap(parsed.get("feature_importance")),
                    toDoubleMap(parsed.get("shap_values"))
            );

        } catch (ResourceAccessException e) {
            log.warn("[MlService] ML service unreachable — using rule-based fallback. ({})", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("[MlService] Risk prediction failed: {}", e.getMessage());
            return null;
        }
    }

    // ── Emotion Analysis (HuggingFace NLP) ───────────────────────────────────

    /**
     * Calls /ml/emotion-analyze with the given text.
     *
     * @param text Journal entry or chat message text
     * @return Dominant emotion + confidence, or null if unavailable
     */
    public MlEmotionResult analyzeEmotion(String text) {
        if (text == null || text.isBlank()) return null;
        try {
            Map<String, Object> body = Map.of("text", text);

            ResponseEntity<String> response = post("/ml/emotion-analyze", body);
            if (response == null || !response.getStatusCode().is2xxSuccessful()) return null;

            Map<String, Object> parsed = objectMapper.readValue(
                    response.getBody(), new TypeReference<>() {}
            );

            return new MlEmotionResult(
                    (String) parsed.get("emotion"),
                    toDouble(parsed.get("confidence")),
                    toDoubleMap(parsed.get("all_scores")),
                    (String) parsed.get("source")
            );

        } catch (ResourceAccessException e) {
            log.warn("[MlService] ML service unreachable for emotion analysis.");
            return null;
        } catch (Exception e) {
            log.error("[MlService] Emotion analysis failed: {}", e.getMessage());
            return null;
        }
    }

    // ── Mood Forecasting (Linear Regression) ─────────────────────────────────

    /**
     * Calls /ml/mood-forecast with the user's recent mood scores.
     *
     * @param scores List of mood scores (1–5), oldest first, up to 30 entries
     * @return Predicted next score + trend, or null if unavailable
     */
    public MlMoodResult forecastMood(List<Integer> scores) {
        if (scores == null || scores.isEmpty()) return null;
        try {
            Map<String, Object> body = Map.of("scores", scores);

            ResponseEntity<String> response = post("/ml/mood-forecast", body);
            if (response == null || !response.getStatusCode().is2xxSuccessful()) return null;

            Map<String, Object> parsed = objectMapper.readValue(
                    response.getBody(), new TypeReference<>() {}
            );

            return new MlMoodResult(
                    toDouble(parsed.get("predicted_score")),
                    (String) parsed.get("trend"),
                    toDouble(parsed.get("slope")),
                    (Boolean) parsed.get("alert"),
                    toInt(parsed.get("data_points_used")),
                    (String) parsed.get("message")
            );

        } catch (ResourceAccessException e) {
            log.warn("[MlService] ML service unreachable for mood forecast.");
            return null;
        } catch (Exception e) {
            log.error("[MlService] Mood forecast failed: {}", e.getMessage());
            return null;
        }
    }

    // ── Internal HTTP helper ──────────────────────────────────────────────────

    private ResponseEntity<String> post(String endpoint, Object body) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Object> entity = new HttpEntity<>(body, headers);

            return restTemplate.postForEntity(mlServiceUrl + endpoint, entity, String.class);
        } catch (ResourceAccessException e) {
            throw e; // re-throw so callers can detect connection failures
        } catch (Exception e) {
            log.error("[MlService] HTTP call to {} failed: {}", endpoint, e.getMessage());
            return null;
        }
    }

    // ── Type-safe converters ──────────────────────────────────────────────────

    private Double toDouble(Object val) {
        if (val == null) return null;
        if (val instanceof Double d) return d;
        if (val instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return null; }
    }

    private Integer toInt(Object val) {
        if (val == null) return null;
        if (val instanceof Integer i) return i;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Double> toDoubleMap(Object val) {
        if (!(val instanceof Map)) return null;
        Map<String, Object> raw = (Map<String, Object>) val;
        Map<String, Double> result = new java.util.LinkedHashMap<>();
        raw.forEach((k, v) -> result.put(k, toDouble(v)));
        return result;
    }
}
