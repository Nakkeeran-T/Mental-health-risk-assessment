import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../context/assessment_context.dart';
import '../components/question_card.dart';
import '../components/custom_button.dart';
import '../theme/app_theme.dart';
import 'results_page.dart';
import 'history_page.dart';

class AssessmentPage extends StatefulWidget {
  const AssessmentPage({super.key});

  @override
  State<AssessmentPage> createState() => _AssessmentPageState();
}

class _AssessmentPageState extends State<AssessmentPage> {
  final _notesController = TextEditingController();

  final List<Map<String, dynamic>> _scales = [
    {
      'id': 'GENERAL',
      'title': 'Comprehensive Assessment',
      'desc': 'Holistic screening measuring depression, anxiety, stress, and sleep.',
      'icon': '🌿',
      'color': AppTheme.primary,
    },
    {
      'id': 'DEPRESSION',
      'title': 'Depression Screener (PHQ-9)',
      'desc': 'Evaluate feelings of low energy, sadness, or lack of interest.',
      'icon': '🌧️',
      'color': const Color(0xFF3B82F6),
    },
    {
      'id': 'ANXIETY',
      'title': 'Anxiety Screener (GAD-7)',
      'desc': 'Measure excessive worry, nervousness, and restlessness.',
      'icon': '⚡',
      'color': const Color(0xFFF59E0B),
    },
    {
      'id': 'STRESS',
      'title': 'Perceived Stress Scale',
      'desc': 'Assess recent feelings of unpredictability and feeling overloaded.',
      'icon': '🔥',
      'color': AppTheme.riskHigh,
    },
  ];

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _startScale(String scaleId) {
    final ctx = context.read<AssessmentContext>();
    ctx.setCategory(scaleId == 'GENERAL' ? null : scaleId);
    ctx.fetchQuestions(scaleId == 'GENERAL' ? null : scaleId).then((_) {
      ctx.nextQuestion(); // step from -1 to 0
    });
  }

  Future<void> _submit() async {
    final ctx = context.read<AssessmentContext>();
    ctx.setNotes(_notesController.text);
    final result = await ctx.submitAssessment();
    if (result != null && mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => ResultsPage(result: result)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final assessment = context.watch<AssessmentContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // 1. Scale Selection Screen (when currentIndex is -1 and no scale active)
    if (assessment.currentIndex == -1) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Clinical Assessment'),
          actions: [
            TextButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const HistoryPage()),
                );
              },
              icon: const Icon(Icons.history_rounded, size: 18),
              label: const Text('History'),
            ),
          ],
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // History shortcut banner
                InkWell(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const HistoryPage()),
                    );
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.cardDark : const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: AppTheme.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.history_rounded, color: AppTheme.primary, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'View Past Assessment History',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Review previous clinical scores and risk trends',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.arrow_forward_ios_rounded,
                          size: 14,
                          color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                        ),
                      ],
                    ),
                  ),
                ),

                const Text(
                  'Choose an Assessment Scale',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Select a standardized clinical check-in to evaluate your current risk level.',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 24),

                if (assessment.isLoading)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(40),
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    ),
                  )
                else
                  ..._scales.map((s) {
                    final scaleColor = s['color'] as Color;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      child: InkWell(
                        onTap: () => _startScale(s['id']),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: isDark ? AppTheme.cardDark : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: scaleColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(
                                  child: Text(s['icon'], style: const TextStyle(fontSize: 24)),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s['title'],
                                      style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      s['desc'],
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                        height: 1.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                Icons.arrow_forward_ios_rounded,
                                size: 16,
                                color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ),
        ),
      );
    }

    // 2. Notes / Summary step (when index reaches questions.length)
    if (assessment.currentIndex >= assessment.questions.length) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Review & Notes'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded),
            onPressed: assessment.previousQuestion,
          ),
        ),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Anything else on your mind? ✍️',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 6),
                Text(
                  'This is completely optional. Share any context, symptoms, or thoughts before viewing your clinical evaluation.',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 20),
                Expanded(
                  child: TextField(
                    controller: _notesController,
                    maxLines: null,
                    expands: true,
                    textAlignVertical: TextAlignVertical.top,
                    decoration: const InputDecoration(
                      hintText: 'Write down what you have been experiencing lately...',
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                CustomButton(
                  text: 'Calculate Risk & View Results',
                  isLoading: assessment.isSubmitting,
                  onPressed: _submit,
                ),
              ],
            ),
          ),
        ),
      );
    }

    // 3. Question Carousel Step
    final currentQ = assessment.questions[assessment.currentIndex];
    final selectedAnswer = assessment.answers[currentQ.id];

    return Scaffold(
      appBar: AppBar(
        title: Text(assessment.selectedCategory ?? 'Assessment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () {
            if (assessment.currentIndex == 0) {
              assessment.reset();
            } else {
              assessment.previousQuestion();
            }
          },
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // Progress Bar
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: (assessment.currentIndex + 1) / (assessment.questions.length + 1),
                  minHeight: 8,
                  backgroundColor: AppTheme.primary.withValues(alpha: 0.12),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
              ),
              const SizedBox(height: 18),

              // Active Question Card
              Expanded(
                child: SingleChildScrollView(
                  child: QuestionCard(
                    question: currentQ,
                    questionNumber: assessment.currentIndex + 1,
                    totalQuestions: assessment.questions.length,
                    selectedScore: selectedAnswer?.score,
                    onOptionSelected: (score, text) {
                      assessment.selectAnswer(currentQ.id, score, text);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Navigation Buttons
              Row(
                children: [
                  if (assessment.currentIndex > 0) ...[
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: assessment.previousQuestion,
                        child: const Text('Back'),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    flex: 2,
                    child: CustomButton(
                      text: assessment.currentIndex == assessment.questions.length - 1
                          ? 'Review & Finish →'
                          : 'Continue →',
                      onPressed: selectedAnswer != null ? assessment.nextQuestion : null,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
