class MentalHealthSignals {
  final int? depressionScore;
  final int? anxietyScore;
  final int? stressLevel;
  final int? sleepQuality;
  final int? appetiteLevel;
  final int? socialEngagement;
  final int? turnsCompleted;
  final String? estimatedRiskLevel;

  MentalHealthSignals({
    this.depressionScore,
    this.anxietyScore,
    this.stressLevel,
    this.sleepQuality,
    this.appetiteLevel,
    this.socialEngagement,
    this.turnsCompleted,
    this.estimatedRiskLevel,
  });

  factory MentalHealthSignals.fromJson(Map<String, dynamic> json) {
    return MentalHealthSignals(
      depressionScore: json['depressionScore'],
      anxietyScore: json['anxietyScore'],
      stressLevel: json['stressLevel'],
      sleepQuality: json['sleepQuality'],
      appetiteLevel: json['appetiteLevel'],
      socialEngagement: json['socialEngagement'],
      turnsCompleted: json['turnsCompleted'],
      estimatedRiskLevel: json['estimatedRiskLevel'],
    );
  }
}

class ChatMessage {
  final String role; // 'user' or 'model'
  final String content;
  final DateTime timestamp;
  final MentalHealthSignals? signals;
  final bool crisisDetected;

  ChatMessage({
    required this.role,
    required this.content,
    DateTime? timestamp,
    this.signals,
    this.crisisDetected = false,
  }) : timestamp = timestamp ?? DateTime.now();

  bool get isUser => role == 'user';

  Map<String, dynamic> toHistoryJson() => {
    'role': role,
    'content': content,
  };
}

class ChatMessageResponseData {
  final String botMessage;
  final MentalHealthSignals? signals;
  final bool assessmentReady;
  final bool crisisDetected;
  final String? sessionId;

  ChatMessageResponseData({
    required this.botMessage,
    this.signals,
    this.assessmentReady = false,
    this.crisisDetected = false,
    this.sessionId,
  });

  factory ChatMessageResponseData.fromJson(Map<String, dynamic> json) {
    return ChatMessageResponseData(
      botMessage: json['botMessage'] ?? '',
      signals: json['signals'] != null
          ? MentalHealthSignals.fromJson(json['signals'] as Map<String, dynamic>)
          : null,
      assessmentReady: json['assessmentReady'] ?? false,
      crisisDetected: json['crisisDetected'] ?? false,
      sessionId: json['sessionId'],
    );
  }
}

class ChatSession {
  final int id;
  final String sessionId;
  final String title;
  final String status;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final int messageCount;

  ChatSession({
    required this.id,
    required this.sessionId,
    required this.title,
    required this.status,
    required this.createdAt,
    this.updatedAt,
    this.messageCount = 0,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      sessionId: json['sessionId']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Chat Session',
      status: json['status']?.toString() ?? 'ACTIVE',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
      messageCount: json['messageCount'] is int
          ? json['messageCount']
          : int.tryParse(json['messageCount']?.toString() ?? '0') ?? 0,
    );
  }
}

