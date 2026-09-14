import 'package:flutter/material.dart';
import '../models/wellness_model.dart';
import '../theme/app_theme.dart';

class HabitTile extends StatelessWidget {
  final Habit habit;
  final VoidCallback onToggle;
  final VoidCallback? onDelete;

  const HabitTile({
    super.key,
    required this.habit,
    required this.onToggle,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isCompleted = habit.isCompletedToday;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: isCompleted
            ? (isDark ? AppTheme.primaryDark.withValues(alpha: 0.2) : const Color(0xFFF0FDF4))
            : (isDark ? AppTheme.cardDark : Colors.white),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(
            color: isCompleted
                ? AppTheme.primaryLight.withValues(alpha: 0.5)
                : (isDark ? AppTheme.borderDark : AppTheme.borderLight),
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          leading: GestureDetector(
            onTap: onToggle,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isCompleted ? AppTheme.primary : Colors.transparent,
                border: Border.all(
                  color: isCompleted ? AppTheme.primary : (isDark ? AppTheme.textSecondaryDark : AppTheme.borderLight),
                  width: 2,
                ),
              ),
              child: isCompleted
                  ? const Icon(Icons.check_rounded, color: Colors.white, size: 20)
                  : null,
            ),
          ),
          title: Text(
            habit.title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              decoration: isCompleted ? TextDecoration.lineThrough : null,
              color: isCompleted
                  ? (isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight)
                  : (isDark ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight),
            ),
          ),
          subtitle: habit.description != null && habit.description!.isNotEmpty
              ? Text(
                  habit.description!,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                )
              : null,
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Text('🔥', style: TextStyle(fontSize: 12)),
                    const SizedBox(width: 4),
                    Text(
                      '${habit.streakCount}d',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              ),
              if (onDelete != null) ...[
                const SizedBox(width: 4),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  onPressed: onDelete,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
