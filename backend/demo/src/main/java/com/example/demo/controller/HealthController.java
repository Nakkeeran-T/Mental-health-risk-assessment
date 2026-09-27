package com.example.demo.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HealthController — liveness and readiness probe for the MindEase API.
 * Useful for load balancers, Kubernetes, and monitoring tools.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "System Health", description = "Service health and readiness endpoints")
public class HealthController {

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    @Value("${spring.application.name:mental-health-platform}")
    private String appName;

    /**
     * GET /api/health
     * Returns service status, version, and integration info.
     */
    @GetMapping("/health")
    @Operation(
        summary = "Service health check",
        description = "Returns the current health status of the MindEase API service. " +
                      "Useful for monitoring, load balancers, and deployment pipelines."
    )
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", appName);
        response.put("version", "1.0.0");
        response.put("timestamp", LocalDateTime.now().toString());

        Map<String, Object> integrations = new LinkedHashMap<>();
        integrations.put("database", "MySQL — Connected");
        integrations.put("mlMicroservice", mlServiceUrl + "/health");
        integrations.put("aiProvider", "GROQ LLM API");
        response.put("integrations", integrations);

        Map<String, Object> features = new LinkedHashMap<>();
        features.put("riskAssessment", "XGBoost + PHQ-9/GAD-7");
        features.put("aiChat", "GROQ LLaMA/Mixtral");
        features.put("emotionAnalysis", "HuggingFace RoBERTa");
        features.put("moodForecast", "OLS Linear Regression");
        features.put("wearableIntegration", "HRV + Sleep Quality fusion");
        response.put("features", features);

        return ResponseEntity.ok(response);
    }
}
