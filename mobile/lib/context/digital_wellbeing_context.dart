import 'package:flutter/material.dart';
import '../api/digital_wellbeing_service.dart';

class DigitalWellbeingContext extends ChangeNotifier with WidgetsBindingObserver {
  final DigitalWellbeingService _service = DigitalWellbeingService();

  DigitalWellbeingData? _data;
  bool _isLoading = false;
  String? _errorMessage;
  DateTime? _lastRefresh;

  DigitalWellbeingData? get data => _data;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  DigitalWellbeingContext() {
    WidgetsBinding.instance.addObserver(this);
    refreshUsage();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Auto-refreshes when user returns from Android Settings after granting usage access.
  /// Throttled to avoid excessive back-to-back refreshes.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final now = DateTime.now();
      final shouldRefresh = _lastRefresh == null ||
          now.difference(_lastRefresh!).inMinutes >= 2;
      if (shouldRefresh) {
        refreshUsage();
      }
    }
  }

  Future<void> refreshUsage() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _data = await _service.fetchUsageToday();
      _lastRefresh = DateTime.now();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> openSettings() async {
    final opened = await _service.openUsageAccessSettings();
    // Auto-refresh is handled by didChangeAppLifecycleState when user returns.
    if (!opened) {
      _errorMessage =
          'Could not open Settings automatically. '
          'Go to Settings › Apps › Special app access › Usage access.';
      notifyListeners();
    }
    return opened;
  }
}
