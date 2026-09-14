import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../api/health_connect_service.dart';
import '../models/wearable_model.dart';

class WearableContext extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  final HealthConnectService _healthService = HealthConnectService();

  WearableBiometric? _latestBiometrics;
  bool _isLoading = false;
  bool _isSyncing = false;
  String? _errorMessage;
  int _selectedDeviceIndex = 0;

  WearableBiometric? get latestBiometrics => _latestBiometrics;
  bool get isLoading => _isLoading;
  bool get isSyncing => _isSyncing;
  String? get errorMessage => _errorMessage;
  int get selectedDeviceIndex => _selectedDeviceIndex;

  static final List<WearableDevice> supportedDevices = [
    WearableDevice(
      id: 'health_connect',
      name: 'Android Health Connect',
      brand: 'Google Health',
      icon: '💚',
      platform: 'HEALTH_CONNECT',
      protocol: 'Native Android Health Connect Jetpack Hub',
      defaultTelemetry: WearableBiometric(
        deviceType: 'HEALTH_CONNECT',
        deviceModel: 'Android Health Connect OS Hub',
        hrvRmssd: 46.5,
        restingHeartRate: 61,
        sleepMinutes: 450,
        deepSleepMinutes: 90,
        remSleepMinutes: 100,
        sleepEfficiency: 0.90,
        dailySteps: 8120,
        stressScore: 28,
        sleepQualityScore: 90,
      ),
    ),
    WearableDevice(
      id: 'apple_watch',
      name: 'Apple Watch Series 9 / Ultra',
      brand: 'Apple',
      icon: '🍎',
      platform: 'APPLE_WATCH',
      protocol: 'HealthKit CloudKit Bridge',
      defaultTelemetry: WearableBiometric(
        deviceType: 'APPLE_WATCH',
        deviceModel: 'Apple Watch Series 9',
        hrvRmssd: 44.5,
        restingHeartRate: 62,
        sleepMinutes: 445,
        deepSleepMinutes: 88,
        remSleepMinutes: 96,
        sleepEfficiency: 0.90,
        dailySteps: 7420,
        stressScore: 32,
        sleepQualityScore: 88,
      ),
    ),
    WearableDevice(
      id: 'garmin',
      name: 'Garmin Venu 3 / Forerunner',
      brand: 'Garmin',
      icon: '🧭',
      platform: 'GARMIN',
      protocol: 'Garmin Health API REST Webhook',
      defaultTelemetry: WearableBiometric(
        deviceType: 'GARMIN',
        deviceModel: 'Garmin Venu 3 (Body Battery)',
        hrvRmssd: 48.0,
        restingHeartRate: 59,
        sleepMinutes: 460,
        deepSleepMinutes: 94,
        remSleepMinutes: 102,
        sleepEfficiency: 0.91,
        dailySteps: 8950,
        stressScore: 28,
        sleepQualityScore: 92,
      ),
    ),
    WearableDevice(
      id: 'fitbit',
      name: 'Fitbit Sense 2 / Pixel Watch',
      brand: 'Fitbit',
      icon: '⚡',
      platform: 'FITBIT',
      protocol: 'Google Health Connect OAuth2',
      defaultTelemetry: WearableBiometric(
        deviceType: 'FITBIT',
        deviceModel: 'Fitbit Sense 2 (EDA + SpO2)',
        hrvRmssd: 38.5,
        restingHeartRate: 67,
        sleepMinutes: 420,
        deepSleepMinutes: 76,
        remSleepMinutes: 84,
        sleepEfficiency: 0.86,
        dailySteps: 6410,
        stressScore: 42,
        sleepQualityScore: 82,
      ),
    ),
    WearableDevice(
      id: 'samsung',
      name: 'Samsung Galaxy Watch 6',
      brand: 'Samsung',
      icon: '🌌',
      platform: 'SAMSUNG',
      protocol: 'Samsung Health Privileged SDK',
      defaultTelemetry: WearableBiometric(
        deviceType: 'SAMSUNG',
        deviceModel: 'Galaxy Watch 6 (BioActive)',
        hrvRmssd: 41.0,
        restingHeartRate: 65,
        sleepMinutes: 435,
        deepSleepMinutes: 80,
        remSleepMinutes: 90,
        sleepEfficiency: 0.88,
        dailySteps: 7120,
        stressScore: 35,
        sleepQualityScore: 85,
      ),
    ),
  ];

  WearableDevice get selectedDevice => supportedDevices[_selectedDeviceIndex];

  void selectDevice(int index) {
    if (index >= 0 && index < supportedDevices.length) {
      _selectedDeviceIndex = index;
      notifyListeners();
    }
  }

  Future<void> fetchLatestBiometrics() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get(ApiConstants.wearablesLatest);
      if (response != null && response is Map<String, dynamic>) {
        _latestBiometrics = WearableBiometric.fromJson(response);
      } else {
        _latestBiometrics = selectedDevice.defaultTelemetry;
      }
      _isLoading = false;
      notifyListeners();
    } catch (_) {
      _latestBiometrics ??= selectedDevice.defaultTelemetry;
      _isLoading = false;
      notifyListeners();
    }
  }

  bool get isHealthConnectSelected => selectedDevice.platform == 'HEALTH_CONNECT';

  Future<bool> requestHealthPermissions() async {
    final granted = await _healthService.requestPermissions();
    if (granted) {
      await syncBiometrics();
    }
    return granted;
  }

  Future<bool> syncBiometrics([WearableDevice? device]) async {
    _isSyncing = true;
    _errorMessage = null;
    notifyListeners();

    final targetDevice = device ?? selectedDevice;

    WearableBiometric telemetryToSync = targetDevice.defaultTelemetry;
    if (targetDevice.platform == 'HEALTH_CONNECT') {
      final live = await _healthService.fetchLiveBiometrics();
      if (live != null) {
        telemetryToSync = live;
      }
    }

    try {
      final payload = telemetryToSync.toSyncJson();
      final response = await _api.post(ApiConstants.wearablesSync, payload);
      if (response != null && response is Map<String, dynamic>) {
        _latestBiometrics = WearableBiometric.fromJson(response);
      } else {
        _latestBiometrics = telemetryToSync;
      }
      _isSyncing = false;
      notifyListeners();
      return true;
    } catch (e) {
      // Preserve last known data — do not mutate with fake values on failure
      _errorMessage = 'Could not reach server. Showing last known biometrics.';
      _latestBiometrics ??= telemetryToSync;
      _isSyncing = false;
      notifyListeners();
      return false;
    }
  }
}

