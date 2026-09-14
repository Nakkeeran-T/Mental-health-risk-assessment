class Question {
  final int id;
  final String questionText;
  final String category;
  final int? orderIndex;
  final bool active;

  Question({
    required this.id,
    required this.questionText,
    required this.category,
    this.orderIndex,
    this.active = true,
  });

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      questionText: json['questionText'] ?? '',
      category: json['category'] ?? 'GENERAL',
      orderIndex: json['orderIndex'],
      active: json['active'] ?? true,
    );
  }
}

class LikertOption {
  final int score;
  final String text;

  const LikertOption({required this.score, required this.text});
}

class AnswerSubmission {
  final int questionId;
  final int score;
  final String responseText;

  AnswerSubmission({
    required this.questionId,
    required this.score,
    required this.responseText,
  });

  Map<String, dynamic> toJson() => {
    'questionId': questionId,
    'score': score,
    'responseText': responseText,
  };
}

class Recommendation {
  final int? id;
  final String title;
  final String description;
  final String? priority;
  final String? category;

  Recommendation({
    this.id,
    required this.title,
    required this.description,
    this.priority,
    this.category,
  });

  factory Recommendation.fromJson(Map<String, dynamic> json) {
    return Recommendation(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      title: json['title'] ?? 'Self-Care Recommendation',
      description: json['description'] ?? '',
      priority: json['priority'],
      category: json['category'],
    );
  }
}

class AssessmentResult {
  final int? id;
  final int totalScore;
  final String riskLevel;
  final String status;
  final String source;
  final double? mlRiskConfidence;
  final String? mlEmotion;
  final String? notes;
  final DateTime? createdAt;
  final List<Recommendation> recommendations;

  AssessmentResult({
    this.id,
    required this.totalScore,
    required this.riskLevel,
    required this.status,
    required this.source,
    this.mlRiskConfidence,
    this.mlEmotion,
    this.notes,
    this.createdAt,
    required this.recommendations,
  });

  factory AssessmentResult.fromJson(Map<String, dynamic> json) {
    var recs = <Recommendation>[];
    if (json['recommendations'] != null && json['recommendations'] is List) {
      recs = (json['recommendations'] as List)
          .map((r) => Recommendation.fromJson(r as Map<String, dynamic>))
          .toList();
    }

    DateTime? created;
    if (json['createdAt'] != null) {
      try {
        created = DateTime.parse(json['createdAt'].toString());
      } catch (_) {}
    }

    return AssessmentResult(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      totalScore: json['totalScore'] is int ? json['totalScore'] : int.tryParse(json['totalScore']?.toString() ?? '0') ?? 0,
      riskLevel: json['riskLevel'] ?? 'LOW',
      status: json['status'] ?? 'COMPLETED',
      source: json['source'] ?? 'MANUAL',
      mlRiskConfidence: json['mlRiskConfidence'] != null
          ? double.tryParse(json['mlRiskConfidence'].toString())
          : null,
      mlEmotion: json['mlEmotion'],
      notes: json['notes'],
      createdAt: created,
      recommendations: recs,
    );
  }
}
