import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class MoodItem {
  final int score;
  final String emoji;
  final String label;

  const MoodItem({required this.score, required this.emoji, required this.label});
}

class MoodSelector extends StatelessWidget {
  final int selectedScore;
  final ValueChanged<int> onSelect;

  static const List<MoodItem> moods = [
    MoodItem(score: 1, emoji: '😢', label: 'Struggling'),
    MoodItem(score: 2, emoji: '😕', label: 'Low'),
    MoodItem(score: 3, emoji: '😐', label: 'Neutral'),
    MoodItem(score: 4, emoji: '🙂', label: 'Good'),
    MoodItem(score: 5, emoji: '😄', label: 'Great'),
  ];

  const MoodSelector({
    super.key,
    required this.selectedScore,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: moods.map((m) {
          final isSelected = m.score == selectedScore;
          return Expanded(
            child: GestureDetector(
              onTap: () => onSelect(m.score),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.symmetric(horizontal: 2),
                padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primary.withValues(alpha: 0.15)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSelected ? AppTheme.primary : Colors.transparent,
                    width: 1.5,
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      m.emoji,
                      style: TextStyle(
                        fontSize: isSelected ? 30 : 25,
                      ),
                    ),
                    const SizedBox(height: 4),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        m.label,
                        maxLines: 1,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          color: isSelected
                              ? AppTheme.primary
                              : (isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
