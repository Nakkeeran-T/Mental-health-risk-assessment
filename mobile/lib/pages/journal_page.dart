import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../context/wellness_context.dart';
import '../theme/app_theme.dart';

class JournalPage extends StatelessWidget {
  const JournalPage({super.key});

  void _showNewEntryDialog(BuildContext context) {
    final titleController = TextEditingController();
    final contentController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Reflection'),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Entry Title',
                    hintText: 'e.g. Navigating work pressure',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: contentController,
                  maxLines: 6,
                  decoration: const InputDecoration(
                    labelText: 'Reflections',
                    hintText: 'What is on your mind? What helped you feel grounded?',
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (contentController.text.trim().isNotEmpty) {
                context.read<WellnessContext>().addJournalEntry(
                  titleController.text.isEmpty ? 'Reflection' : titleController.text,
                  contentController.text,
                );
                Navigator.pop(ctx);
              }
            },
            child: const Text('Save Reflection'),
          ),
        ],
      ),
    );
  }

  Color _getSentimentColor(String? sentiment) {
    switch (sentiment?.toUpperCase()) {
      case 'POSITIVE':
        return AppTheme.riskLow;
      case 'NEGATIVE':
        return AppTheme.riskHigh;
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final wellness = context.watch<WellnessContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reflective Journal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_note_rounded),
            tooltip: 'Write Reflection',
            onPressed: () => _showNewEntryDialog(context),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Prompt Suggestion Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                child: const Row(
                  children: [
                    Text('💡', style: TextStyle(fontSize: 20)),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Writing your worries out onto paper externalizes them and takes away their emotional sting.',
                        style: TextStyle(fontSize: 12, height: 1.35),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              const Text(
                'Past Entries',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              if (wellness.journalEntries.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.cardDark : Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
                  ),
                  child: Center(
                    child: Column(
                      children: [
                        const Text('📖', style: TextStyle(fontSize: 32)),
                        const SizedBox(height: 8),
                        const Text('Your journal is currently empty.'),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => _showNewEntryDialog(context),
                          child: const Text('Write Your First Entry'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...wellness.journalEntries.map((entry) {
                  final formattedDate = DateFormat('MMMM d, yyyy • h:mm a').format(entry.createdAt);
                  final sentimentColor = _getSentimentColor(entry.sentiment);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.cardDark : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                entry.title,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                            if (entry.sentiment != null) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: sentimentColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  entry.sentiment!.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: sentimentColor,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          formattedDate,
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          entry.content,
                          style: TextStyle(
                            fontSize: 13.5,
                            height: 1.45,
                            color: isDark ? AppTheme.textPrimaryDark : const Color(0xFF334155),
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
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.edit_rounded),
        label: const Text('Write Reflection'),
        onPressed: () => _showNewEntryDialog(context),
      ),
    );
  }
}
