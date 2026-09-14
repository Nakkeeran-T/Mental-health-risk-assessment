import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:app_usage/app_usage.dart';
import 'package:url_launcher/url_launcher.dart';

class AppUsageSummary {
  final String packageName;
  final String appName;
  final Duration usage;
  final String category;
  final String icon;

  AppUsageSummary({
    required this.packageName,
    required this.appName,
    required this.usage,
    required this.category,
    required this.icon,
  });

  String get formattedDuration {
    final hours = usage.inHours;
    final minutes = usage.inMinutes.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    }
    return '${minutes}m';
  }
}

class DigitalWellbeingData {
  final Duration totalScreenTime;
  final Duration lateNightScreenTime; // 11 PM to 5 AM
  final int totalUnlocksEstimate;
  final List<AppUsageSummary> topApps;
  final bool isLiveSource;
  final String? permissionNotice;
  final DateTime queriedAt;

  DigitalWellbeingData({
    required this.totalScreenTime,
    required this.lateNightScreenTime,
    required this.totalUnlocksEstimate,
    required this.topApps,
    required this.isLiveSource,
    this.permissionNotice,
    DateTime? queriedAt,
  }) : queriedAt = queriedAt ?? DateTime.now();

  String get formattedTotalTime {
    final hours = totalScreenTime.inHours;
    final minutes = totalScreenTime.inMinutes.remainder(60);
    return '${hours}h ${minutes}m';
  }

  String get formattedLateNightTime {
    final minutes = lateNightScreenTime.inMinutes;
    if (minutes >= 60) {
      return '${minutes ~/ 60}h ${minutes % 60}m';
    }
    return '${minutes}m';
  }

  bool get hasHighLateNightUsage => lateNightScreenTime.inMinutes > 45;
  bool get hasExcessiveScreenTime => totalScreenTime.inHours >= 6;
}

class DigitalWellbeingService {
  static final DigitalWellbeingService _instance = DigitalWellbeingService._internal();
  factory DigitalWellbeingService() => _instance;
  DigitalWellbeingService._internal();

  /// Attempts to open Android Usage Access Settings
  Future<bool> openUsageAccessSettings() async {
    if (kIsWeb || !Platform.isAndroid) return false;
    try {
      final uri = Uri.parse('package:android.settings.USAGE_ACCESS_SETTINGS');
      if (await canLaunchUrl(uri)) {
        return await launchUrl(uri);
      }
    } catch (_) {}
    return false;
  }

  /// Fetches app usage data for today (midnight to now)
  Future<DigitalWellbeingData> fetchUsageToday() async {
    if (kIsWeb || !Platform.isAndroid) {
      return _getSimulatedWellbeingData('Running on non-Android platform (using simulated wellbeing telemetry)');
    }

    try {
      final now = DateTime.now();
      final midnight = DateTime(now.year, now.month, now.day, 0, 0, 0);

      // Query usage statistics
      List<AppUsageInfo> infoList = await AppUsage().getAppUsage(midnight, now);

      if (infoList.isEmpty) {
        return _getSimulatedWellbeingData('No app usage recorded yet today');
      }

      // Filter system / background processes with < 1 minute usage
      final significantApps = infoList.where((info) {
        final ignorePackages = [
          'com.android.systemui',
          'com.google.android.googlequicksearchbox',
          'com.google.android.inputmethod.latin',
        ];
        return info.usage.inSeconds >= 60 && !ignorePackages.contains(info.packageName);
      }).toList();

      significantApps.sort((a, b) => b.usage.compareTo(a.usage));

      Duration totalDuration = Duration.zero;
      final List<AppUsageSummary> topApps = [];

      for (final app in significantApps) {
        totalDuration += app.usage;
        if (topApps.length < 8) {
          final catInfo = _categorizeApp(app.packageName, app.appName);
          topApps.add(AppUsageSummary(
            packageName: app.packageName,
            appName: _cleanAppName(app.appName, app.packageName),
            usage: app.usage,
            category: catInfo.category,
            icon: catInfo.icon,
          ));
        }
      }

      // Estimate late-night usage (11 PM to 5 AM)
      Duration lateNightUsage = Duration.zero;
      final hour = now.hour;
      if (totalDuration.inMinutes > 0) {
        if (hour < 5) {
          // Currently in late-night window — most of today's usage IS late-night usage
          lateNightUsage = Duration(minutes: (totalDuration.inMinutes * 0.7).round());
        } else if (hour >= 23) {
          // Just entered late-night window
          lateNightUsage = Duration(minutes: (totalDuration.inMinutes * 0.15).round());
        } else {
          // Daytime: rough estimate only, no artificial minimum
          final estimatedMinutes = (totalDuration.inMinutes * 0.10).round();
          lateNightUsage = Duration(minutes: estimatedMinutes); // 0 if no usage
        }
      }


      return DigitalWellbeingData(
        totalScreenTime: totalDuration,
        lateNightScreenTime: lateNightUsage,
        totalUnlocksEstimate: (totalDuration.inMinutes / 4.5).round().clamp(15, 120),
        topApps: topApps,
        isLiveSource: true,
      );
    } catch (_) {
      return _getSimulatedWellbeingData(
        'Usage access permission required. Tap to grant permission in Android Settings.',
      );
    }
  }

  static ({String category, String icon}) _categorizeApp(String pkg, String name) {
    final lowerPkg = pkg.toLowerCase();
    final lowerName = name.toLowerCase();

    final combined = '$lowerPkg $lowerName';

    if (combined.contains('instagram') ||
        combined.contains('facebook') ||
        combined.contains('tiktok') ||
        combined.contains('twitter') ||
        combined.contains('x.android') ||
        combined.contains('snapchat') ||
        combined.contains('reddit')) {
      return (category: 'Social Media', icon: '📱');
    }
    if (combined.contains('youtube') ||
        combined.contains('netflix') ||
        combined.contains('spotify') ||
        combined.contains('twitch') ||
        combined.contains('primevideo')) {
      return (category: 'Entertainment', icon: '🎬');
    }
    if (combined.contains('whatsapp') ||
        combined.contains('telegram') ||
        combined.contains('signal') ||
        combined.contains('messaging')) {
      return (category: 'Communication', icon: '💬');
    }
    if (combined.contains('chrome') ||
        combined.contains('browser') ||
        combined.contains('gmail') ||
        combined.contains('docs') ||
        combined.contains('drive') ||
        combined.contains('slack')) {
      return (category: 'Productivity', icon: '💼');
    }
    return (category: 'Utilities & General', icon: '⚙️');
  }


  static String _cleanAppName(String rawName, String pkg) {
    if (rawName.trim().isNotEmpty && !rawName.contains('.')) {
      return rawName;
    }
    final parts = pkg.split('.');
    if (parts.isNotEmpty) {
      final last = parts.last;
      return last[0].toUpperCase() + last.substring(1);
    }
    return 'Application';
  }

  /// High quality simulated baseline for testing, emulators, or ungranted permission state
  static DigitalWellbeingData _getSimulatedWellbeingData([String? notice]) {
    return DigitalWellbeingData(
      totalScreenTime: const Duration(hours: 4, minutes: 18),
      lateNightScreenTime: const Duration(minutes: 54),
      totalUnlocksEstimate: 62,
      isLiveSource: false,
      permissionNotice: notice,
      topApps: [
        AppUsageSummary(
          packageName: 'com.instagram.android',
          appName: 'Instagram',
          usage: const Duration(hours: 1, minutes: 35),
          category: 'Social Media',
          icon: '📱',
        ),
        AppUsageSummary(
          packageName: 'com.google.android.youtube',
          appName: 'YouTube',
          usage: const Duration(hours: 1, minutes: 12),
          category: 'Entertainment',
          icon: '🎬',
        ),
        AppUsageSummary(
          packageName: 'com.whatsapp',
          appName: 'WhatsApp',
          usage: const Duration(minutes: 48),
          category: 'Communication',
          icon: '💬',
        ),
        AppUsageSummary(
          packageName: 'com.android.chrome',
          appName: 'Chrome',
          usage: const Duration(minutes: 25),
          category: 'Productivity',
          icon: '💼',
        ),
        AppUsageSummary(
          packageName: 'com.spotify.music',
          appName: 'Spotify',
          usage: const Duration(minutes: 18),
          category: 'Entertainment',
          icon: '🎵',
        ),
      ],
    );
  }
}
