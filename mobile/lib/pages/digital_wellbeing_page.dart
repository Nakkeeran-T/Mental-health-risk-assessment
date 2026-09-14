import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/digital_wellbeing_service.dart';
import '../context/digital_wellbeing_context.dart';
import '../theme/app_theme.dart';

class DigitalWellbeingPage extends StatelessWidget {
  const DigitalWellbeingPage({super.key});

  @override
  Widget build(BuildContext context) {
    final wellbeing = context.watch<DigitalWellbeingContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final data = wellbeing.data;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Digital Wellbeing'),
        actions: [
          IconButton(
            icon: wellbeing.isLoading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                  )
                : const Icon(Icons.refresh_rounded),
            onPressed: wellbeing.isLoading ? null : () => wellbeing.refreshUsage(),
          ),
        ],
      ),
      body: SafeArea(
        child: wellbeing.isLoading && data == null
            ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Screen Habits & Wellness',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Daily device usage patterns and late-night activity directly shape your sleep, mood, and focus.',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Permission / Live Source Banner
                    _buildSourceBanner(context, wellbeing, isDark),
                    const SizedBox(height: 20),

                    // Total Screen Time Hero Card
                    if (data != null) ...[
                      _buildHeroCard(data, isDark),
                      const SizedBox(height: 20),

                      // Quick Metrics Grid
                      _buildMetricsGrid(data, isDark),
                      const SizedBox(height: 24),

                      // Mental Health Correlation Insight
                      _buildMentalHealthInsightCard(data, isDark),
                      const SizedBox(height: 24),

                      // Top Used Apps Breakdown
                      const Text(
                        "Today's App Activity",
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      ...data.topApps.map((app) => _buildAppItem(app, data.totalScreenTime, isDark)),
                      const SizedBox(height: 32),
                    ],
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSourceBanner(BuildContext context, DigitalWellbeingContext contextRef, bool isDark) {
    final data = contextRef.data;
    final isLive = data?.isLiveSource ?? false;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isLive
            ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
            : (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB)),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isLive
              ? (isDark ? const Color(0xFF059669) : const Color(0xFFA7F3D0))
              : (isDark ? const Color(0xFFB45309) : const Color(0xFFFDE68A)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isLive ? Icons.verified_rounded : Icons.info_outline_rounded,
                color: isLive ? AppTheme.riskLow : AppTheme.riskModerate,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isLive ? 'Live Android UsageStats Connected' : 'Android Usage Access Required',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: isLive
                        ? (isDark ? const Color(0xFFA7F3D0) : const Color(0xFF065F46))
                        : (isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isLive
                ? 'Your device screen time and foreground app usage are actively syncing to assess behavioral stress and insomnia risk.'
                : 'To read your exact daily screen time, Android requires granting Usage Access permission in system settings.',
            style: TextStyle(
              fontSize: 12.5,
              color: isDark ? Colors.white70 : Colors.black87,
              height: 1.4,
            ),
          ),
          if (!isLive) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              ),
              icon: const Icon(Icons.settings_accessibility_rounded, size: 18),
              label: const Text('Open Android Settings', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              onPressed: () async {
                final opened = await contextRef.openSettings();
                if (!opened && context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please navigate to Settings > Apps > Special app access > Usage access'),
                    ),
                  );
                }
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeroCard(DigitalWellbeingData data, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
              : [const Color(0xFFEEF2FF), const Color(0xFFF8FAFC)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF3730A3) : const Color(0xFFC7D2FE),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TOTAL SCREEN TIME TODAY',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.1,
                  color: isDark ? const Color(0xFFA5B4FC) : const Color(0xFF4F46E5),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: data.hasExcessiveScreenTime
                      ? AppTheme.riskHigh.withValues(alpha: 0.15)
                      : AppTheme.riskLow.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  data.hasExcessiveScreenTime ? 'High Exposure' : 'Balanced',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: data.hasExcessiveScreenTime ? AppTheme.riskHigh : AppTheme.riskLow,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            data.formattedTotalTime,
            style: const TextStyle(
              fontSize: 38,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Measured from midnight to current time across all foreground apps.',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid(DigitalWellbeingData data, bool isDark) {
    return Row(
      children: [
        // Late Night Screen Time
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: data.hasHighLateNightUsage
                    ? AppTheme.riskHigh.withValues(alpha: 0.4)
                    : (isDark ? AppTheme.borderDark : AppTheme.borderLight),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('🌙', style: TextStyle(fontSize: 18)),
                    const Spacer(),
                    if (data.hasHighLateNightUsage)
                      const Icon(Icons.warning_amber_rounded, size: 16, color: AppTheme.riskHigh),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  data.formattedLateNightTime,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: data.hasHighLateNightUsage ? AppTheme.riskHigh : null,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Late Night (11pm-5am)',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),

        // Estimated Unlocks
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Text('🔓', style: TextStyle(fontSize: 18)),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  '${data.totalUnlocksEstimate}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Device Unlocks',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMentalHealthInsightCard(DigitalWellbeingData data, bool isDark) {
    final bool hasRisk = data.hasHighLateNightUsage || data.hasExcessiveScreenTime;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(hasRisk ? '🧠' : '✨', style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  hasRisk ? 'Wellness Notice' : 'Healthy Digital Rhythm',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  hasRisk
                      ? 'Elevated late-night screen exposure disrupts circadian melatonin synthesis. Consider turning on Bedtime Mode 45 minutes before sleep.'
                      : 'Your device usage today remains within a healthy range, supporting stable mood focus and restorative sleep cycles.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppItem(AppUsageSummary app, Duration totalDuration, bool isDark) {
    final fraction = totalDuration.inSeconds > 0
        ? (app.usage.inSeconds / totalDuration.inSeconds).clamp(0.0, 1.0)
        : 0.0;
    final percentage = (fraction * 100).round();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : AppTheme.cardLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text(app.icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      app.appName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    Text(
                      app.category,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    app.formattedDuration,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    '$percentage%',
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: fraction,
              minHeight: 5,
              backgroundColor: isDark ? Colors.white10 : Colors.black12,
              valueColor: AlwaysStoppedAnimation<Color>(
                app.category == 'Social Media'
                    ? AppTheme.accent
                    : (app.category == 'Entertainment' ? AppTheme.calmingBlue : AppTheme.primary),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
