class WellnessScore {
  final int compositeScore;
  final int? riskComponent;
  final int? moodComponent;
  final int? habitComponent;
  final int? journalComponent;
  final String label;
  final String? description;

  WellnessScore({
    required this.compositeScore,
    this.riskComponent,
    this.moodComponent,
    this.habitComponent,
    this.journalComponent,
    required this.label,
    this.description,
  });

  factory WellnessScore.fromJson(Map<String, dynamic> json) {
    return WellnessScore(
      compositeScore: json['compositeScore'] is int
          ? json['compositeScore']
          : int.tryParse(json['compositeScore']?.toString() ?? '70') ?? 70,
      riskComponent: json['riskComponent'] is int ? json['riskComponent'] : null,
      moodComponent: json['moodComponent'] is int ? json['moodComponent'] : null,
      habitComponent: json['habitComponent'] is int ? json['habitComponent'] : null,
      journalComponent: json['journalComponent'] is int ? json['journalComponent'] : null,
      label: json['label'] ?? 'Stable',
      description: json['description'],
    );
  }
}

class MoodEntry {
  final int? id;
  final int moodScore; // 1 to 5
  final String? note;
  final DateTime createdAt;

  MoodEntry({
    this.id,
    required this.moodScore,
    this.note,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory MoodEntry.fromJson(Map<String, dynamic> json) {
    DateTime created = DateTime.now();
    if (json['createdAt'] != null) {
      try {
        created = DateTime.parse(json['createdAt'].toString());
      } catch (_) {}
    }
    return MoodEntry(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      moodScore: json['moodScore'] is int ? json['moodScore'] : int.tryParse(json['moodScore']?.toString() ?? '3') ?? 3,
      note: json['note'],
      createdAt: created,
    );
  }
}

class Habit {
  final int id;
  final String title;
  final String? description;
  final int streakCount;
  final DateTime? lastCompletedAt;

  Habit({
    required this.id,
    required this.title,
    this.description,
    this.streakCount = 0,
    this.lastCompletedAt,
  });

  bool get isCompletedToday {
    if (lastCompletedAt == null) return false;
    final now = DateTime.now();
    return lastCompletedAt!.year == now.year &&
        lastCompletedAt!.month == now.month &&
        lastCompletedAt!.day == now.day;
  }

  factory Habit.fromJson(Map<String, dynamic> json) {
    DateTime? last;
    if (json['lastCompletedAt'] != null) {
      try {
        last = DateTime.parse(json['lastCompletedAt'].toString());
      } catch (_) {}
    }
    return Habit(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      title: json['title'] ?? '',
      description: json['description'],
      streakCount: json['streakCount'] is int ? json['streakCount'] : int.tryParse(json['streakCount']?.toString() ?? '0') ?? 0,
      lastCompletedAt: last,
    );
  }
}

class JournalEntry {
  final int? id;
  final String title;
  final String content;
  final String? sentiment; // POSITIVE, NEUTRAL, NEGATIVE
  final double? sentimentScore;
  final DateTime createdAt;

  JournalEntry({
    this.id,
    required this.title,
    required this.content,
    this.sentiment,
    this.sentimentScore,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory JournalEntry.fromJson(Map<String, dynamic> json) {
    DateTime created = DateTime.now();
    if (json['createdAt'] != null) {
      try {
        created = DateTime.parse(json['createdAt'].toString());
      } catch (_) {}
    }
    return JournalEntry(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      title: json['title'] ?? 'Journal Entry',
      content: json['content'] ?? '',
      sentiment: json['sentiment'],
      sentimentScore: json['sentimentScore'] != null
          ? double.tryParse(json['sentimentScore'].toString())
          : null,
      createdAt: created,
    );
  }
}
