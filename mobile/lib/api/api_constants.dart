import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConstants {
  // Determine appropriate default host based on platform
  static String get defaultBaseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api';
    } else if (Platform.isAndroid) {
      // 10.0.2.2 points to host machine loopback on Android Emulator
      return 'http://10.0.2.2:8080/api';
    } else {
      // iOS Simulator, macOS, Windows desktop
      return 'http://localhost:8080/api';
    }
  }

  // Auth & User endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String currentUser = '/users/me';

  // Questions & Assessment endpoints
  static const String questions = '/questions';
  static const String questionsCategory = '/questions/category';
  static const String submitAssessment = '/assessments/submit';
  static const String assessmentHistory = '/assessments/history';
  static const String assessmentById = '/assessments';

  // AI Chat endpoints
  static const String chatMessage = '/chat/message';
  static const String chatSessions = '/chat/sessions';

  // Wellness & Tracker endpoints
  static const String wellnessScore = '/wellness/score';
  static const String mood = '/mood';
  static const String moodHistory = '/mood/history';
  static const String habits = '/habits';
  static const String journal = '/journal';

  // Wearables & Biometrics
  static const String wearablesLatest = '/wearables/latest';
  static const String wearablesSync = '/wearables/sync';
}
