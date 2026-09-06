package com.example.demo.service;

import com.example.demo.dto.request.WearableSyncRequest;
import com.example.demo.dto.response.WearableBiometricResponse;

public interface WearableService {

    WearableBiometricResponse getLatestBiometrics(String userEmail);

    WearableBiometricResponse syncBiometrics(WearableSyncRequest request, String userEmail);

    void processCloudWebhook(String payload);
}
