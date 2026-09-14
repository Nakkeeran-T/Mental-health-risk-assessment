import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/auth_model.dart';

class AuthContext extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  User? _user;
  String? _token;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _errorMessage;

  User? get user => _user;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get errorMessage => _errorMessage;

  AuthContext() {
    _loadPersistedUser();
  }

  Future<void> _loadPersistedUser() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('jwt_token');
    if (_token != null && _token!.isNotEmpty) {
      await _api.setAuthToken(_token);
    }
    final userJson = prefs.getString('user_profile');
    if (userJson != null) {
      try {
        _user = User.fromJson(jsonDecode(userJson));
      } catch (_) {}
    }
    _isInitialized = true;
    notifyListeners();

    // Silently refresh latest profile details from backend
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }

  Future<void> fetchCurrentUser() async {
    if (!isAuthenticated) return;
    try {
      final response = await _api.get(ApiConstants.currentUser);
      if (response != null && response is Map<String, dynamic>) {
        _user = User.fromJson(response);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('user_profile', jsonEncode(_user!.toJson()));
        notifyListeners();
      }
    } catch (_) {}
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post(ApiConstants.login, {
        'email': email.trim(),
        'password': password,
      });

      final authResponse = AuthResponse.fromJson(response);
      _token = authResponse.token;
      _user = authResponse.toUser();

      await _api.setAuthToken(_token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_profile', jsonEncode(_user!.toJson()));

      _isLoading = false;
      notifyListeners();

      // Refresh full profile details in background
      fetchCurrentUser();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String fullName, String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final parts = fullName.trim().split(RegExp(r'\s+'));
      final firstName = parts.isNotEmpty ? parts.first : 'User';
      final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : 'Member';

      final response = await _api.post(ApiConstants.register, {
        'firstName': firstName,
        'lastName': lastName,
        'email': email.trim(),
        'password': password,
        // dateOfBirth intentionally omitted — should be collected in a proper onboarding step
      });

      final authResponse = AuthResponse.fromJson(response);
      _token = authResponse.token;
      _user = authResponse.toUser();

      await _api.setAuthToken(_token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_profile', jsonEncode(_user!.toJson()));

      _isLoading = false;
      notifyListeners();

      fetchCurrentUser();
      return true;
    } catch (e) {
      _isLoading = false;
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _user = null;
    _token = null;
    await _api.setAuthToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_profile');
    await prefs.remove('jwt_token');
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
