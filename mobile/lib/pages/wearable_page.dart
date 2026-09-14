import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../context/wearable_context.dart';
import '../components/custom_button.dart';
import '../theme/app_theme.dart';

class WearablePage extends StatelessWidget {
  const WearablePage({super.key});

  @override
  Widget build(BuildContext context) {
    final wearable = context.watch<WearableContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final biometrics = wearable.latestBiometrics ?? wearable.selectedDevice.defaultTelemetry;
    final formattedDate = DateFormat('EEEE, MMM d • h:mm a').format(biometrics.syncedAt);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Smartwatch & Biometrics'),
        actions: [
          IconButton(
            icon: wearable.isSyncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
                  )
                : const Icon(Icons.sync_rounded),
            onPressed: wearable.isSyncing ? null : () => wearable.syncBiometrics(),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Connected Health Wearables',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Continuous physiological signals inform your mental wellness recovery score.',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 20),

              // Device Selector Chips
              const Text(
                'Select Synced Smartwatch',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 48,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: WearableContext.supportedDevices.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (ctx, i) {
                    final device = WearableContext.supportedDevices[i];
                    final isSelected = i == wearable.selectedDeviceIndex;

                    return ChoiceChip(
                      avatar: Text(device.icon, style: const TextStyle(fontSize: 16)),
                      label: Text(device.name),
                      selected: isSelected,
                      selectedColor: AppTheme.primary,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                      ),
                      onSelected: (_) {
                        wearable.selectDevice(i);
                        wearable.syncBiometrics(device);
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),

              // Sync Status Banner
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF134E4A), const Color(0xFF0F172A)]
                        : [const Color(0xFFCCFBF1), Colors.white],
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(child: Text('📡', style: TextStyle(fontSize: 20))),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            wearable.selectedDevice.protocol,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Last updated: $formattedDate',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Detailed Biometrics
              const Text(
                'Live Physiological Telemetry',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              _buildDetailedRow(
                'Heart Rate Variability (HRV)',
                '${biometrics.hrvRmssd.toStringAsFixed(1)} ms',
                'Parasympathetic tone & stress resilience',
                Icons.favorite_rounded,
                AppTheme.riskHigh,
                isDark,
              ),
              const SizedBox(height: 10),
              _buildDetailedRow(
                'Sleep Quality & Duration',
                biometrics.formattedSleepHours,
                'Deep: ${biometrics.deepSleepMinutes ?? 85}m | REM: ${biometrics.remSleepMinutes ?? 90}m',
                Icons.bedtime_rounded,
                AppTheme.accent,
                isDark,
              ),
              const SizedBox(height: 10),
              _buildDetailedRow(
                'Resting Heart Rate',
                '${biometrics.restingHeartRate} bpm',
                'Baseline cardiovascular metric',
                Icons.monitor_heart_rounded,
                AppTheme.calmingBlue,
                isDark,
              ),
              const SizedBox(height: 10),
              _buildDetailedRow(
                'Daily Physical Steps',
                '${biometrics.dailySteps} steps',
                'Releases natural endorphins to combat fatigue',
                Icons.directions_walk_rounded,
                AppTheme.primary,
                isDark,
              ),

              const SizedBox(height: 24),

              if (wearable.isHealthConnectSelected) ...[
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    side: const BorderSide(color: AppTheme.primary, width: 1.5),
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.security_rounded, size: 20),
                  label: const Text(
                    'Request Health Connect Permissions',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  onPressed: wearable.isSyncing
                      ? null
                      : () async {
                          final granted = await wearable.requestHealthPermissions();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  granted
                                      ? 'Health Connect access granted! Synced latest biometrics.'
                                      : 'Permissions dialog dismissed or not granted.',
                                ),
                              ),
                            );
                          }
                        },
                ),
                const SizedBox(height: 12),
              ],

              CustomButton(
                text: wearable.isSyncing
                    ? 'Synchronizing Telemetry...'
                    : (wearable.isHealthConnectSelected
                        ? 'Sync Android Health Connect'
                        : 'Sync Smartwatch Now'),
                icon: Icons.sync_rounded,
                isLoading: wearable.isSyncing,
                onPressed: () => wearable.syncBiometrics(),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailedRow(
    String title,
    String value,
    String subtitle,
    IconData icon,
    Color color,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
