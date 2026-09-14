import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'breathing_page.dart';
import 'mood_page.dart';
import 'habits_page.dart';
import 'journal_page.dart';
import 'wearable_page.dart';
import 'history_page.dart';
import 'chat_page.dart';

class WellnessHubPage extends StatelessWidget {
  const WellnessHubPage({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final List<Map<String, dynamic>> tools = [
      {
        'title': 'Smartwatch Biometrics Sync',
        'subtitle': 'Live Apple Watch, Garmin & Fitbit HRV and sleep telemetry',
        'icon': Icons.watch_rounded,
        'emoji': '⌚',
        'color': AppTheme.primary,
        'page': const WearablePage(),
      },
      {
        'title': 'Breathing Exercises',
        'subtitle': 'Box Breathing, 4-7-8 Relaxation, and Equal Breathing guide',
        'icon': Icons.air_rounded,
        'emoji': '🌬️',
        'color': AppTheme.calmingBlue,
        'page': const BreathingPage(),
      },
      {
        'title': 'Daily Mood Check-In',
        'subtitle': 'Log emotional state, intensity, and personal reflections',
        'icon': Icons.mood_rounded,
        'emoji': '✨',
        'color': const Color(0xFFF59E0B),
        'page': const MoodPage(),
      },
      {
        'title': 'Self-Care Habits & Streaks',
        'subtitle': 'Build daily micro-habits that guard against burnout',
        'icon': Icons.check_circle_outline_rounded,
        'emoji': '🔥',
        'color': AppTheme.primaryDark,
        'page': const HabitsPage(),
      },
      {
        'title': 'Reflective Journaling',
        'subtitle': 'Express feelings in writing with AI emotional sentiment tags',
        'icon': Icons.book_outlined,
        'emoji': '📓',
        'color': AppTheme.accent,
        'page': const JournalPage(),
      },
      {
        'title': 'Assessment Records History',
        'subtitle': 'Review your past clinical risk evaluations and scores over time',
        'icon': Icons.history_rounded,
        'emoji': '📋',
        'color': const Color(0xFF3B82F6),
        'page': const HistoryPage(),
      },
      {
        'title': 'AI Chat Conversations History',
        'subtitle': 'Browse and continue your past emotional support conversations',
        'icon': Icons.forum_rounded,
        'emoji': '💬',
        'color': AppTheme.accent,
        'page': const ChatPage(initialOpenHistory: true),
      },
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Wellness Tools & Habits'),
      ),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          itemCount: tools.length,
          separatorBuilder: (_, _) => const SizedBox(height: 14),
          itemBuilder: (ctx, i) {
            final tool = tools[i];
            final color = tool['color'] as Color;

            return InkWell(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => tool['page'] as Widget),
                );
              },
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.cardDark : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          tool['emoji'],
                          style: const TextStyle(fontSize: 24),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            tool['title'],
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            tool['subtitle'],
                            style: TextStyle(
                              fontSize: 12.5,
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
            );
          },
        ),
      ),
    );
  }
}
