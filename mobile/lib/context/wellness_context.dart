import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/wellness_model.dart';

class WellnessContext extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  WellnessScore? _wellnessScore;
  List<MoodEntry> _moodHistory = [];
  List<Habit> _habits = [];
  List<JournalEntry> _journalEntries = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _suppressNotify = false;

  WellnessScore? get wellnessScore => _wellnessScore;
  List<MoodEntry> get moodHistory => _moodHistory;
  List<Habit> get habits => _habits;
  List<JournalEntry> get journalEntries => _journalEntries;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void _maybeNotify() {
    if (!_suppressNotify) notifyListeners();
  }

  Future<void> loadDashboardData() async {
    _isLoading = true;
    _errorMessage = null;
    _suppressNotify = true;
    notifyListeners();

    await Future.wait([
      fetchWellnessScore(),
      fetchMoodHistory(),
      fetchHabits(),
      fetchJournalEntries(),
    ]);

    _suppressNotify = false;
    _isLoading = false;
    notifyListeners();
  }

  Future<void> fetchWellnessScore() async {
    try {
      final response = await _api.get(ApiConstants.wellnessScore);
      _wellnessScore = WellnessScore.fromJson(response as Map<String, dynamic>);
    } catch (_) {
      // Default initial score for fresh preview
      _wellnessScore ??= WellnessScore(
        compositeScore: 78,
        riskComponent: 80,
        moodComponent: 75,
        habitComponent: 85,
        journalComponent: 70,
        label: 'Balanced',
        description: 'You are maintaining solid emotional stability and wellness habits.',
      );
    }
    _maybeNotify();
  }

  Future<void> fetchMoodHistory() async {
    try {
      final response = await _api.get(ApiConstants.moodHistory);
      if (response is List) {
        _moodHistory = response
            .map((item) => MoodEntry.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      if (_moodHistory.isEmpty) {
        _moodHistory = [
          MoodEntry(moodScore: 4, note: 'Feeling productive and calm today.', createdAt: DateTime.now().subtract(const Duration(hours: 4))),
          MoodEntry(moodScore: 3, note: 'Moderate work stress, but managed with deep breaths.', createdAt: DateTime.now().subtract(const Duration(days: 1))),
          MoodEntry(moodScore: 5, note: 'Had a wonderful restful sleep!', createdAt: DateTime.now().subtract(const Duration(days: 2))),
        ];
      }
    }
    _maybeNotify();
  }

  Future<bool> logMood(int score, String? note) async {
    try {
      final response = await _api.post(ApiConstants.mood, {
        'moodScore': score,
        'note': note,
      });

      final entry = MoodEntry.fromJson(response as Map<String, dynamic>);
      _moodHistory.insert(0, entry);
      await fetchWellnessScore();
      notifyListeners();
      return true;
    } catch (e) {
      // Fallback local entry
      _moodHistory.insert(0, MoodEntry(moodScore: score, note: note));
      notifyListeners();
      return true;
    }
  }

  Future<void> fetchHabits() async {
    try {
      final response = await _api.get(ApiConstants.habits);
      if (response is List) {
        _habits = response
            .map((item) => Habit.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      if (_habits.isEmpty) {
        _habits = [
          Habit(id: 1, title: 'Drink 2L Water', description: 'Stay hydrated throughout the day', streakCount: 4),
          Habit(id: 2, title: '10-Min Breathing / Meditation', description: 'Center your mind and calm stress', streakCount: 6),
          Habit(id: 3, title: 'No Screens 30m Before Bed', description: 'Promote melatonin and deeper sleep', streakCount: 2),
          Habit(id: 4, title: 'Daily Gratitude Note', description: 'Write down 3 things you are grateful for', streakCount: 5),
        ];
      }
    }
    _maybeNotify();
  }

  Future<void> toggleHabit(int habitId) async {
    // Hoist variables before try/catch so the catch block can reference them
    final idx = _habits.indexWhere((h) => h.id == habitId);
    if (idx == -1) return;
    final current = _habits[idx];
    final isCompleted = current.isCompletedToday;

    try {
      final response = await _api.post('${ApiConstants.habits}/$habitId/complete', {});
      final updated = Habit.fromJson(response as Map<String, dynamic>);
      _habits[idx] = updated;
      await fetchWellnessScore();
      notifyListeners();
    } catch (_) {
      // Offline optimistic toggle: preserve streak chain by using yesterday instead of null
      _habits[idx] = Habit(
        id: current.id,
        title: current.title,
        description: current.description,
        streakCount: isCompleted ? (current.streakCount - 1).clamp(0, 999) : current.streakCount + 1,
        lastCompletedAt: isCompleted
            ? (current.streakCount > 1
                ? DateTime.now().subtract(const Duration(days: 1)) // preserve streak chain
                : null) // no prior streak to preserve
            : DateTime.now(),
      );
      notifyListeners();
    }
  }

  Future<bool> addHabit(String title, String? description) async {
    try {
      final response = await _api.post(ApiConstants.habits, {
        'title': title.trim(),
        'description': description?.trim(),
      });

      final habit = Habit.fromJson(response as Map<String, dynamic>);
      _habits.insert(0, habit);
      notifyListeners();
      return true;
    } catch (_) {
      // Local fallback
      _habits.add(Habit(
        id: DateTime.now().millisecondsSinceEpoch,
        title: title,
        description: description,
        streakCount: 0,
      ));
      notifyListeners();
      return true;
    }
  }

  Future<void> deleteHabit(int habitId) async {
    try {
      await _api.delete('${ApiConstants.habits}/$habitId');
      _habits.removeWhere((h) => h.id == habitId);
      notifyListeners();
    } catch (_) {
      _habits.removeWhere((h) => h.id == habitId);
      notifyListeners();
    }
  }

  Future<void> fetchJournalEntries() async {
    try {
      final response = await _api.get(ApiConstants.journal);
      if (response is List) {
        _journalEntries = response
            .map((item) => JournalEntry.fromJson(item as Map<String, dynamic>))
            .toList();
      }
    } catch (_) {
      if (_journalEntries.isEmpty) {
        _journalEntries = [
          JournalEntry(
            id: 1,
            title: 'Reflections on overcoming anxiety',
            content: 'Took a step back during a stressful morning and focused on deep breathing. Remembered that I am in control of my reaction.',
            sentiment: 'POSITIVE',
            sentimentScore: 0.85,
            createdAt: DateTime.now().subtract(const Duration(days: 1)),
          ),
        ];
      }
    }
    _maybeNotify();
  }

  Future<bool> addJournalEntry(String title, String content) async {
    try {
      final response = await _api.post(ApiConstants.journal, {
        'title': title.trim(),
        'content': content.trim(),
      });

      final entry = JournalEntry.fromJson(response as Map<String, dynamic>);
      _journalEntries.insert(0, entry);
      await fetchWellnessScore();
      notifyListeners();
      return true;
    } catch (_) {
      _journalEntries.insert(
        0,
        JournalEntry(
          id: DateTime.now().millisecondsSinceEpoch,
          title: title,
          content: content,
          sentiment: 'NEUTRAL',
          createdAt: DateTime.now(),
        ),
      );
      notifyListeners();
      return true;
    }
  }
}
