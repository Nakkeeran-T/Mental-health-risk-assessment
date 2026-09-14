import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../api/api_constants.dart';
import '../models/assessment_model.dart';

class AssessmentContext extends ChangeNotifier {
  final ApiClient _api = ApiClient();

  List<Question> _questions = [];
  final Map<int, AnswerSubmission> _answers = {};
  int _currentIndex = -1; // -1 = scale select / intro, 0..N-1 = questions, N = notes
  String _notes = '';
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;
  AssessmentResult? _lastResult;
  List<AssessmentResult> _history = [];
  String? _selectedCategory;

  List<Question> get questions => _questions;
  Map<int, AnswerSubmission> get answers => _answers;
  int get currentIndex => _currentIndex;
  String get notes => _notes;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  AssessmentResult? get lastResult => _lastResult;
  List<AssessmentResult> get history => _history;
  String? get selectedCategory => _selectedCategory;

  bool get isComplete => _questions.isNotEmpty && _answers.length == _questions.length;
  double get progress => _questions.isEmpty ? 0 : (_answers.length / _questions.length);

  void setCategory(String? category) {
    _selectedCategory = category;
    _answers.clear();
    _notes = '';
    _currentIndex = -1;
    notifyListeners();
  }

  void setNotes(String val) {
    _notes = val;
    notifyListeners();
  }

  Future<void> fetchQuestions([String? category]) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final endpoint = category != null && category.isNotEmpty
          ? '${ApiConstants.questionsCategory}/$category'
          : ApiConstants.questions;

      final response = await _api.get(endpoint);
      if (response is List) {
        _questions = response
            .map((q) => Question.fromJson(q as Map<String, dynamic>))
            .where((q) => q.active)
            .toList();
      } else {
        _questions = [];
      }

      // Fallback questions if backend questions table is currently empty
      if (_questions.isEmpty) {
        _questions = _getFallbackQuestions(category);
      }

      _currentIndex = -1;
      _answers.clear();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      // Provide fallback questions so user experience is always functional
      _questions = _getFallbackQuestions(category);
      _errorMessage = null; // silent fallback with friendly notification
      notifyListeners();
    }
  }

  void selectAnswer(int questionId, int score, String responseText) {
    _answers[questionId] = AnswerSubmission(
      questionId: questionId,
      score: score,
      responseText: responseText,
    );
    notifyListeners();
  }

  void nextQuestion() {
    if (_questions.isNotEmpty && _currentIndex < _questions.length) {
      _currentIndex++;
      notifyListeners();
    }
  }

  void previousQuestion() {
    if (_currentIndex > -1) {
      _currentIndex--;
      notifyListeners();
    }
  }

  void reset() {
    _currentIndex = -1;
    _answers.clear();
    _notes = '';
    _lastResult = null;
    notifyListeners();
  }

  Future<AssessmentResult?> submitAssessment() async {
    if (!isComplete) {
      _errorMessage = 'Please complete all questions before submitting.';
      notifyListeners();
      return null;
    }

    _isSubmitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final payload = {
        'notes': _notes,
        'answers': _answers.values.map((a) => a.toJson()).toList(),
      };

      final response = await _api.post(ApiConstants.submitAssessment, payload);
      final result = AssessmentResult.fromJson(response as Map<String, dynamic>);
      _lastResult = result;
      _isSubmitting = false;
      notifyListeners();
      return result;
    } catch (e) {
      _isSubmitting = false;
      _errorMessage = e.toString();
      // Calculate local estimate if backend offline
      int total = _answers.values.fold(0, (sum, a) => sum + a.score);
      String risk = total > 15 ? 'HIGH' : (total > 8 ? 'MODERATE' : 'LOW');
      _lastResult = AssessmentResult(
        totalScore: total,
        riskLevel: risk,
        status: 'COMPLETED',
        source: 'MANUAL',
        notes: _notes,
        createdAt: DateTime.now(),
        recommendations: [
          Recommendation(
            title: 'Mindfulness & Deep Breathing',
            description: 'Practice structured 4-7-8 breathing sessions twice daily to calm the autonomic nervous system.',
          ),
          Recommendation(
            title: 'Sleep Hygiene Schedule',
            description: 'Maintain a consistent sleep window and avoid blue light exposure 60 minutes before bedtime.',
          ),
        ],
      );
      notifyListeners();
      return _lastResult;
    }
  }

  Future<void> fetchHistory() async {
    try {
      final response = await _api.get(ApiConstants.assessmentHistory);
      if (response is List) {
        _history = response
            .map((item) => AssessmentResult.fromJson(item as Map<String, dynamic>))
            .toList();
        notifyListeners();
      }
    } catch (_) {}
  }

  List<Question> _getFallbackQuestions(String? category) {
    return [
      Question(id: 1, questionText: 'Little interest or pleasure in doing things you usually enjoy?', category: 'DEPRESSION'),
      Question(id: 2, questionText: 'Feeling down, depressed, or hopeless over the past 2 weeks?', category: 'DEPRESSION'),
      Question(id: 3, questionText: 'Trouble falling or staying asleep, or sleeping too much?', category: 'SLEEP'),
      Question(id: 4, questionText: 'Feeling tired or having little energy throughout the day?', category: 'GENERAL'),
      Question(id: 5, questionText: 'Feeling nervous, anxious, or on edge recently?', category: 'ANXIETY'),
      Question(id: 6, questionText: 'Not being able to stop or control worrying?', category: 'ANXIETY'),
      Question(id: 7, questionText: 'Feeling overwhelmed by your current responsibilities?', category: 'STRESS'),
      Question(id: 8, questionText: 'Feeling isolated or withdrawing from conversations with friends or family?', category: 'SOCIAL'),
    ];
  }
}
