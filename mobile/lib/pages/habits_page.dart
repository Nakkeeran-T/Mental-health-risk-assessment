import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../context/wellness_context.dart';
import '../components/habit_tile.dart';
import '../theme/app_theme.dart';

class HabitsPage extends StatelessWidget {
  const HabitsPage({super.key});

  void _showAddHabitDialog(BuildContext context) {
    final titleController = TextEditingController();
    final descController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Self-Care Habit'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Habit Title',
                hintText: 'e.g., 15-Minute Morning Walk',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              decoration: const InputDecoration(
                labelText: 'Description (Optional)',
                hintText: 'e.g., Get sunlight and move body',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (titleController.text.trim().isNotEmpty) {
                context.read<WellnessContext>().addHabit(
                  titleController.text,
                  descController.text,
                );
                Navigator.pop(ctx);
              }
            },
            child: const Text('Add Habit'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final wellness = context.watch<WellnessContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final completedCount = wellness.habits.where((h) => h.isCompletedToday).length;
    final totalCount = wellness.habits.length;
    final progress = totalCount == 0 ? 0.0 : (completedCount / totalCount);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Habits & Streaks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            tooltip: 'Add Habit',
            onPressed: () => _showAddHabitDialog(context),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress Banner
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF134E4A), const Color(0xFF0F2927)]
                        : [const Color(0xFFCCFBF1), const Color(0xFFF0FDF4)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TODAY\'S PROGRESS',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '$completedCount of $totalCount Completed',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: progress,
                              minHeight: 7,
                              backgroundColor: Colors.white60,
                              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      '${(progress * 100).toInt()}%',
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Daily Self-Care Routine',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              if (wellness.habits.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.cardDark : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
                  ),
                  child: Center(
                    child: Column(
                      children: [
                        const Text('🌱', style: TextStyle(fontSize: 32)),
                        const SizedBox(height: 8),
                        const Text('No habits added yet!'),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => _showAddHabitDialog(context),
                          child: const Text('Add Your First Habit'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...wellness.habits.map((habit) {
                  return HabitTile(
                    habit: habit,
                    onToggle: () => wellness.toggleHabit(habit.id),
                    onDelete: () => wellness.deleteHabit(habit.id),
                  );
                }),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Habit'),
        onPressed: () => _showAddHabitDialog(context),
      ),
    );
  }
}
