import 'dart:math';
import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/chat_model.dart';

class ChatContext extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  final List<ChatMessage> _messages = [];
  List<ChatSession> _sessions = [];
  bool _isTyping = false;
  bool _loadingSessions = false;
  bool _loadingHistory = false;
  String? _errorMessage;
  MentalHealthSignals? _currentSignals;
  bool _crisisDetected = false;
  String _sessionId = '';
  String? _currentSessionTitle;

  List<ChatMessage> get messages => _messages;
  List<ChatSession> get sessions => _sessions;
  bool get isTyping => _isTyping;
  bool get loadingSessions => _loadingSessions;
  bool get loadingHistory => _loadingHistory;
  String? get errorMessage => _errorMessage;
  MentalHealthSignals? get currentSignals => _currentSignals;
  bool get crisisDetected => _crisisDetected;
  String get sessionId => _sessionId;
  String? get currentSessionTitle => _currentSessionTitle;

  ChatContext() {
    _initSession();
    fetchSessions();
  }

  void _initSession([String? newId, String? title]) {
    _sessionId = newId ?? 'mobile-session-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
    _currentSessionTitle = title;
    _messages.clear();
    _crisisDetected = false;
    _currentSignals = null;

    // Welcome greeting
    _messages.add(
      ChatMessage(
        role: 'model',
        content: "Hello! I'm your empathetic mental wellness buddy. I'm here to listen without judgment, guide you through calming exercises, or just talk through whatever is on your mind today. How are you feeling right now?",
      ),
    );
  }

  Future<void> startNewSession() async {
    try {
      final response = await _api.post('/chat/sessions/new', {});
      if (response is Map<String, dynamic> && response['sessionId'] != null) {
        _initSession(response['sessionId']?.toString(), response['title']?.toString());
      } else {
        _initSession();
      }
    } catch (_) {
      _initSession();
    }
    notifyListeners();
    fetchSessions();
  }

  void resetSession() {
    startNewSession();
  }

  Future<void> fetchSessions() async {
    _loadingSessions = true;
    notifyListeners();
    try {
      final res = await _api.get(ApiConstants.chatSessions);
      if (res is List) {
        _sessions = res.map((item) => ChatSession.fromJson(item as Map<String, dynamic>)).toList();
      }
    } catch (_) {} finally {
      _loadingSessions = false;
      notifyListeners();
    }
  }

  Future<void> loadSession(String targetSessionId, {String? title}) async {
    _loadingHistory = true;
    _sessionId = targetSessionId;
    _currentSessionTitle = title;
    notifyListeners();

    try {
      final res = await _api.get('/chat/sessions/$targetSessionId');
      if (res is List && res.isNotEmpty) {
        _messages.clear();
        for (final item in res) {
          if (item is Map<String, dynamic>) {
            final sender = (item['sender'] ?? 'BOT').toString().toUpperCase();
            final content = item['content']?.toString() ?? '';
            final timestamp = item['timestamp'] != null
                ? DateTime.tryParse(item['timestamp'].toString())
                : null;
            _messages.add(
              ChatMessage(
                role: sender == 'USER' ? 'user' : 'model',
                content: content,
                timestamp: timestamp,
              ),
            );
          }
        }
      }
    } catch (_) {} finally {
      _loadingHistory = false;
      notifyListeners();
    }
  }

  Future<void> deleteSession(String targetSessionId) async {
    try {
      await _api.delete('/chat/sessions/$targetSessionId');
      _sessions.removeWhere((s) => s.sessionId == targetSessionId);
      if (_sessionId == targetSessionId) {
        _initSession();
      }
      notifyListeners();
    } catch (_) {}
  }

  Future<void> sendMessage(String text) async {
    final userText = text.trim();
    if (userText.isEmpty || _isTyping) return;

    // Append user message immediately
    _messages.add(ChatMessage(role: 'user', content: userText));
    _isTyping = true;
    _errorMessage = null;
    notifyListeners();

    try {
      // Build conversation turn history
      final history = _messages
          .sublist(0, _messages.length - 1)
          .map((m) => m.toHistoryJson())
          .toList();

      final payload = {
        'message': userText,
        'sessionId': _sessionId,
        'history': history,
      };

      final response = await _api.post(ApiConstants.chatMessage, payload);
      final responseData = ChatMessageResponseData.fromJson(response as Map<String, dynamic>);

      _currentSignals = responseData.signals ?? _currentSignals;
      if (responseData.crisisDetected) {
        _crisisDetected = true;
      }

      _messages.add(
        ChatMessage(
          role: 'model',
          content: responseData.botMessage,
          signals: _currentSignals,
          crisisDetected: responseData.crisisDetected,
        ),
      );

      _isTyping = false;
      notifyListeners();
      fetchSessions();
    } catch (e) {
      _isTyping = false;
      // Provide empathetic local fallback if backend is unreachable
      String fallbackResponse = "Thank you for sharing that with me. Even when technology has hiccups, remember to take a deep, slow breath. What is one small thing that would bring you comfort right now?";
      
      // Simple offline crisis check
      final lower = userText.toLowerCase();
      if (lower.contains('suicide') || lower.contains('kill myself') || lower.contains('end my life') || lower.contains('self harm')) {
        _crisisDetected = true;
        fallbackResponse = "I care about your safety very much. If you are having thoughts of hurting yourself, please reach out right away. You can call 988 or 112 immediately for free, confidential support 24/7.";
      }

      _messages.add(
        ChatMessage(
          role: 'model',
          content: fallbackResponse,
          crisisDetected: _crisisDetected,
        ),
      );
      notifyListeners();
    }
  }

  void dismissCrisisBanner() {
    _crisisDetected = false;
    notifyListeners();
  }
}
