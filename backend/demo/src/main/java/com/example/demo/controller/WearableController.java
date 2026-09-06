package com.example.demo.controller;

import com.example.demo.dto.request.WearableSyncRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.WearableBiometricResponse;
import com.example.demo.service.WearableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wearables")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Wearables", description = "Smartwatch & wearable biometric sensor telemetry (Option 1)")
public class WearableController {

    private final WearableService wearableService;

    /**
     * GET /api/wearables/latest
     * Retrieves the latest wearable snapshot (HRV, Sleep, Steps).
     */
    @GetMapping("/latest")
    @Operation(summary = "Get latest smartwatch biometrics (HRV, Sleep, Steps)")
    public ResponseEntity<ApiResponse<WearableBiometricResponse>> getLatest(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "patient@example.com";
        WearableBiometricResponse response = wearableService.getLatestBiometrics(email);
        return ResponseEntity.ok(ApiResponse.success("Latest wearable biometric telemetry retrieved", response));
    }

    /**
     * POST /api/wearables/sync
     * Syncs new telemetry from cloud aggregator or manual device pull.
     */
    @PostMapping("/sync")
    @Operation(summary = "Sync new physiological telemetry from smartwatch")
    public ResponseEntity<ApiResponse<WearableBiometricResponse>> syncBiometrics(
            @RequestBody(required = false) WearableSyncRequest request,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : "patient@example.com";
        WearableSyncRequest payload = request != null ? request : new WearableSyncRequest();
        WearableBiometricResponse response = wearableService.syncBiometrics(payload, email);
        return ResponseEntity.ok(ApiResponse.success("Wearable telemetry synchronized successfully", response));
    }

    /**
     * POST /api/wearables/webhook
     * Public cloud webhook receiver for Terra API / Vital API.
     */
    @PostMapping("/webhook")
    @Operation(summary = "Public cloud webhook receiver for wearable aggregators")
    public ResponseEntity<ApiResponse<Void>> handleCloudWebhook(@RequestBody String payload) {
        wearableService.processCloudWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success("Webhook processed", null));
    }
}
