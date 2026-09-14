import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../context/auth_context.dart';
import '../context/wellness_context.dart';
import '../context/assessment_context.dart';
import '../components/wellness_gauge.dart';
import '../components/stat_card.dart';
import '../components/habit_tile.dart';
import '../theme/app_theme.dart';
import 'assessment_page.dart';
import 'chat_page.dart';
import 'breathing_page.dart';
import 'mood_page.dart';
import 'crisis_page.dart';
import 'profile_page.dart';
import 'wearable_page.dart';
import 'history_page.dart';
import 'digital_wellbeing_page.dart';
import '../context/wearable_context.dart';
import '../context/digital_wellbeing_context.dart';
import '../components/wearable_card.dart';

class DashboardPage extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const DashboardPage({super.key, this.onNavigateTab});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthContext>();
      if (auth.isAuthenticated) {
        auth.fetchCurrentUser();
        context.read<AssessmentContext>().fetchHistory();
      }
      context.read<WellnessContext>().loadDashboardData();
      context.read<WearableContext>().fetchLatestBiometrics();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthContext>();
    final wellness = context.watch<WellnessContext>();
    final wearable = context.watch<WearableContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userName = auth.user?.displayName ?? 'Friend';
    final formattedDate = DateFormat('EEEE, MMMM d').format(DateTime.now());

    final score = wellness.wellnessScore?.compositeScore ?? 78;
    final label = wellness.wellnessScore?.label ?? 'Balanced & Calm';

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            final auth = context.read<AuthContext>();
            final futures = <Future<void>>[
              wellness.loadDashboardData(),
              context.read<WearableContext>().fetchLatestBiometrics(),
            ];
            if (auth.isAuthenticated) {
              futures.add(auth.fetchCurrentUser());
              futures.add(context.read<AssessmentContext>().fetchHistory());
            }
            await Future.wait(futures);
          },
          color: AppTheme.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: User greeting
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const ProfilePage()),
                          );
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Hello, $userName 👋',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    formattedDate,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.riskHigh.withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.sos_rounded, color: AppTheme.riskHigh, size: 20),
                      ),
                      tooltip: 'Emergency SOS',
                      onPressed: () {
                        if (widget.onNavigateTab != null) {
                          widget.onNavigateTab!(5);
                        } else {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const CrisisPage()));
                        }
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Wellness composite gauge
                WellnessGauge(
                  score: score,
                  label: label,
                  subtitle: wellness.wellnessScore?.description,
                ),
                const SizedBox(height: 24),

                // Quick Actions Title
                const Text(
                  'Quick Actions',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),

                // 2x2 Grid of Key Tools
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.98,
                  children: [
                    StatCard(
                      title: 'Risk Assessment',
                      value: 'Check-In',
                      subtitle: 'Clinical screening',
                      icon: Icons.assignment_outlined,
                      iconColor: AppTheme.primary,
                      onTap: () {
                        if (widget.onNavigateTab != null) {
                          widget.onNavigateTab!(1);
                        } else {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const AssessmentPage()));
                        }
                      },
                    ),
                    StatCard(
                      title: 'AI Companion',
                      value: 'Chat Now',
                      subtitle: '24/7 empathetic listener',
                      icon: Icons.chat_bubble_outline_rounded,
                      iconColor: AppTheme.accent,
                      onTap: () {
                        if (widget.onNavigateTab != null) {
                          widget.onNavigateTab!(3);
                        } else {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatPage()));
                        }
                      },
                    ),
                    StatCard(
                      title: 'Breathing Orb',
                      value: 'Unwind',
                      subtitle: 'Box & 4-7-8 exercises',
                      icon: Icons.air_rounded,
                      iconColor: AppTheme.calmingBlue,
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const BreathingPage()));
                      },
                    ),
                    StatCard(
                      title: 'Daily Mood',
                      value: 'Log Emotion',
                      subtitle: 'Reflect on today',
                      icon: Icons.mood_rounded,
                      iconColor: const Color(0xFFEAB308),
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const MoodPage()));
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Daily Thought Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [const Color(0xFF2E1065), const Color(0xFF1E1B4B)]
                          : [const Color(0xFFEDE9FE), const Color(0xFFF5F3FF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: AppTheme.accent.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Text('✨', style: TextStyle(fontSize: 26)),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'DAILY AFFIRMATION',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                                color: isDark ? AppTheme.accentLight : AppTheme.accent,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '"You do not have to control your thoughts. You just have to stop letting them control you."',
                              style: TextStyle(
                                fontSize: 13,
                                fontStyle: FontStyle.italic,
                                height: 1.35,
                                color: isDark ? Colors.white : const Color(0xFF3B0764),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Smartwatch Telemetry Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Smartwatch Biometrics',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const WearablePage()),
                        );
                      },
                      child: const Text('Manage'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                WearableCard(
                  biometrics: wearable.latestBiometrics ?? wearable.selectedDevice.defaultTelemetry,
                  isSyncing: wearable.isSyncing,
                  onSync: () => wearable.syncBiometrics(),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const WearablePage()),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Digital Wellbeing & Habits Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text(
                        'Digital Wellbeing & Screen Habits',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const DigitalWellbeingPage()),
                        );
                      },
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _buildDigitalWellbeingCard(context, isDark),
                const SizedBox(height: 24),

                // Clinical History Shortcut
                InkWell(
                  onTap: () {
                    if (widget.onNavigateTab != null) {
                      widget.onNavigateTab!(2);
                    } else {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const HistoryPage()),
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(18),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.cardDark : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.history_rounded, color: AppTheme.primary, size: 20),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Assessment History Timeline',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Text(
                                'Track your clinical evaluations over time',
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
                const SizedBox(height: 24),

                // Today's Habits Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Today's Self-Care Habits",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        if (widget.onNavigateTab != null) {
                          widget.onNavigateTab!(4);
                        }
                      },
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (wellness.habits.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('No habits created yet. Tap View All to create one!'),
                  )
                else
                  ...wellness.habits.take(3).map((h) => HabitTile(
                    habit: h,
                    onToggle: () => wellness.toggleHabit(h.id),
                  )),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDigitalWellbeingCard(BuildContext context, bool isDark) {
    final wellbeing = context.watch<DigitalWellbeingContext>();
    final data = wellbeing.data;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DigitalWellbeingPage()),
        );
      },
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppTheme.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
          ),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.phone_android_rounded, color: Color(0xFF6366F1), size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data != null ? data.formattedTotalTime : 'Screen Habits',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        data != null
                            ? (data.hasHighLateNightUsage
                                ? '⚠️ Late-night screen activity detected'
                                : 'Daily device usage & focus')
                            : 'Tracking app habits...',
                        style: TextStyle(
                          fontSize: 12,
                          color: data?.hasHighLateNightUsage == true
                              ? AppTheme.riskModerate
                              : (isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: Colors.grey),
              ],
            ),
            if (data != null && data.topApps.isNotEmpty) ...[
              const SizedBox(height: 12),
              Divider(height: 1, color: isDark ? Colors.white10 : Colors.black12),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Top: ${data.topApps.take(2).map((a) => a.appName).join(', ')}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                    ),
                  ),
                  Text(
                    '${data.totalUnlocksEstimate} unlocks',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
