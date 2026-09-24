import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../context/wellness_context.dart';
import '../components/mood_selector.dart';
import '../components/custom_button.dart';
import '../theme/app_theme.dart';

class MoodPage extends StatefulWidget {
  const MoodPage({super.key});

  @override
  State<MoodPage> createState() => _MoodPageState();
}

class _MoodPageState extends State<MoodPage> {
  int _selectedScore = 4;
  final _noteController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  String _getMoodEmoji(int score) {
    switch (score) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😄';
      default: return '🙂';
    }
  }

  String _getMoodLabel(int score) {
    switch (score) {
      case 1: return 'Struggling';
      case 2: return 'Low';
      case 3: return 'Neutral';
      case 4: return 'Good';
      case 5: return 'Great';
      default: return 'Neutral';
    }
  }

  Future<void> _handleSave() async {
    setState(() => _isSaving = true);
    final wellness = context.read<WellnessContext>();
    await wellness.logMood(_selectedScore, _noteController.text.trim());
    _noteController.clear();
    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mood check-in logged! Thank you for reflecting.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final wellness = context.watch<WellnessContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mood Tracking'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'How are you feeling right now?',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Taking 30 seconds to acknowledge your emotions builds lasting emotional awareness.',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 16),

              // Mood Emoji Selector
              MoodSelector(
                selectedScore: _selectedScore,
                onSelect: (score) => setState(() => _selectedScore = score),
              ),
              const SizedBox(height: 16),

              // Note Input
              TextField(
                controller: _noteController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Add a brief note about what caused this feeling (optional)...',
                ),
              ),
              const SizedBox(height: 16),

              CustomButton(
                text: 'Log Today\'s Mood',
                isLoading: _isSaving,
                onPressed: _handleSave,
              ),
              const SizedBox(height: 28),

              // History Section
              const Text(
                'Recent Check-Ins',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              if (wellness.moodHistory.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.cardDark : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
                  ),
                  child: const Center(
                    child: Text('No mood check-ins recorded yet.'),
                  ),
                )
              else
                ...wellness.moodHistory.map((entry) {
                  final formattedTime = DateFormat('MMM d, h:mm a').format(entry.createdAt);
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.cardDark : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getMoodEmoji(entry.moodScore),
                          style: const TextStyle(fontSize: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      _getMoodLabel(entry.moodScore),
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w700,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    formattedTime,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                              if (entry.note != null && entry.note!.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(
                                  entry.note!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}
