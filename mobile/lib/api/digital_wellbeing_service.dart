import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
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

  static const MethodChannel _nativeChannel = MethodChannel('com.mentalhealth.app/digital_wellbeing');

  /// Attempts to open Android Usage Access Settings
  Future<bool> openUsageAccessSettings() async {
    if (kIsWeb || !Platform.isAndroid) return false;
    try {
      await _nativeChannel.invokeMethod('openUsageSettings');
      return true;
    } catch (_) {
      try {
        final uri = Uri.parse('package:android.settings.USAGE_ACCESS_SETTINGS');
        if (await canLaunchUrl(uri)) {
          return await launchUrl(uri);
        }
      } catch (_) {}
    }
    return false;
  }

  /// Fetches app usage data for today (midnight to now)
  Future<DigitalWellbeingData> fetchUsageToday() async {
    if (kIsWeb || !Platform.isAndroid) {
      return _getSimulatedWellbeingData('Running on non-Android platform (using simulated wellbeing telemetry)');
    }

    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day, 0, 0, 0);

    // 1. Try native UsageEvents query first (Matches Android OS Digital Wellbeing exactly!)
    try {
      final dynamic raw = await _nativeChannel.invokeMethod('getExactWellbeingData', {
        'start': midnight.millisecondsSinceEpoch,
        'end': now.millisecondsSinceEpoch,
      });

      if (raw is Map) {
        final totalSec = (raw['totalScreenTimeSeconds'] as num?)?.toInt() ?? 0;
        final lateNightSec = (raw['lateNightScreenTimeSeconds'] as num?)?.toInt() ?? 0;
        final unlockCount = (raw['unlockCount'] as num?)?.toInt() ?? 0;
        final rawApps = raw['apps'] as List? ?? [];

        final List<AppUsageSummary> topApps = [];
        for (final item in rawApps) {
          if (item is Map) {
            final pkg = item['packageName']?.toString() ?? '';
            final name = item['appName']?.toString() ?? pkg;
            final sec = (item['durationSeconds'] as num?)?.toInt() ?? 0;
            final catInfo = _categorizeApp(pkg, name);

            topApps.add(AppUsageSummary(
              packageName: pkg,
              appName: _cleanAppName(name, pkg),
              usage: Duration(seconds: sec),
              category: catInfo.category,
              icon: catInfo.icon,
            ));
            if (topApps.length >= 8) break;
          }
        }

        if (totalSec > 0 || topApps.isNotEmpty) {
          return DigitalWellbeingData(
            totalScreenTime: Duration(seconds: totalSec),
            lateNightScreenTime: Duration(seconds: lateNightSec),
            totalUnlocksEstimate: unlockCount > 0 ? unlockCount : (totalSec / 270).round().clamp(5, 120),
            topApps: topApps,
            isLiveSource: true,
          );
        }
      }
    } catch (e) {
      debugPrint('Native Digital Wellbeing query fallback: $e');
    }

    try {
      final now = DateTime.now();
      final midnight = DateTime(now.year, now.month, now.day, 0, 0, 0);
      final maxPossibleToday = now.difference(midnight);

      // Query usage statistics
      List<AppUsageInfo> infoList = await AppUsage().getAppUsage(midnight, now);

      if (infoList.isEmpty) {
        return _getSimulatedWellbeingData('No app usage recorded yet today');
      }

      // Filter out OEM / system background daemons and internal processes
      final userApps = infoList.where((info) {
        if (_isSystemOrBackgroundPackage(info.packageName)) return false;
        return info.usage.inSeconds >= 60;
      }).toList();

      userApps.sort((a, b) => b.usage.compareTo(a.usage));

      final List<AppUsageSummary> topApps = [];
      for (final app in userApps) {
        final clampedUsage = app.usage > maxPossibleToday ? maxPossibleToday : app.usage;
        if (topApps.length < 5) {
          final catInfo = _categorizeApp(app.packageName, app.appName);
          topApps.add(AppUsageSummary(
            packageName: app.packageName,
            appName: _cleanAppName(app.appName, app.packageName),
            usage: clampedUsage,
            category: catInfo.category,
            icon: catInfo.icon,
          ));
        }
      }

      // In real Digital Wellbeing, screen time is the active usage of your primary apps
      // Summing only the top apps avoids double-counting background system services
      Duration totalDuration = Duration.zero;
      for (final app in topApps) {
        totalDuration += app.usage;
      }

      // Hard clamp: screen time cannot exceed elapsed time today
      if (totalDuration > maxPossibleToday) {
        totalDuration = maxPossibleToday;
      }

      // Estimate late-night usage (11 PM to 5 AM)
      Duration lateNightUsage = Duration.zero;
      final hour = now.hour;
      if (totalDuration.inMinutes > 0) {
        if (hour < 5) {
          // Currently in late-night window
          lateNightUsage = Duration(minutes: (totalDuration.inMinutes * 0.7).round());
        } else if (hour >= 23) {
          // Just entered late-night window
          lateNightUsage = Duration(minutes: (totalDuration.inMinutes * 0.15).round());
        } else {
          final estimatedMinutes = (totalDuration.inMinutes * 0.10).round();
          lateNightUsage = Duration(minutes: estimatedMinutes);
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

  /// Identifies and filters out OEM (OnePlus/Oppo/ColorOS), Android OS, and background system services
  static bool _isSystemOrBackgroundPackage(String pkg) {
    final lower = pkg.toLowerCase();

    // Specific user-facing apps that might start with com.google or com.android that SHOULD be kept:
    const allowedUserApps = [
      'com.google.android.youtube',
      'com.google.android.apps.youtube.music',
      'com.android.chrome',
      'com.google.android.apps.messaging',
      'com.google.android.gm',
      'com.google.android.apps.photos',
      'com.google.android.apps.maps',
      'com.google.android.apps.docs',
      'com.google.android.calendar',
      'com.google.android.keep',
    ];
    if (allowedUserApps.contains(lower)) return false;

    // Filter out OEM daemons, system services, and background frameworks
    if (lower.startsWith('com.oplus.') ||
        lower.startsWith('com.coloros.') ||
        lower.startsWith('com.heytap.') ||
        lower.startsWith('com.qualcomm.') ||
        lower.startsWith('com.mediatek.') ||
        lower.startsWith('vendor.') ||
        lower.startsWith('android.') ||
        lower.startsWith('com.android.internal') ||
        lower.startsWith('com.android.providers.') ||
        lower.startsWith('com.android.server.') ||
        lower.startsWith('com.android.bluetooth') ||
        lower.startsWith('com.android.systemui') ||
        lower.startsWith('com.android.settings') ||
        lower.startsWith('com.android.launcher') ||
        lower.startsWith('com.android.phone') ||
        lower.startsWith('com.android.stk') ||
        lower.startsWith('com.android.shell') ||
        lower.startsWith('com.android.nfc') ||
        lower.startsWith('com.android.location') ||
        lower.startsWith('com.android.companiondevicemanager') ||
        lower.startsWith('com.android.managedprovisioning') ||
        lower.startsWith('com.android.pacprocessor') ||
        lower.startsWith('com.android.certinstaller') ||
        lower.startsWith('com.android.backupconfirm') ||
        lower.startsWith('com.android.keychain') ||
        lower.startsWith('com.android.htmlviewer') ||
        lower.startsWith('com.android.externalstorage') ||
        lower.startsWith('com.android.dynsystem') ||
        lower.startsWith('com.android.cts') ||
        lower.startsWith('com.google.android.gms') ||
        lower.startsWith('com.google.android.gsf') ||
        lower.startsWith('com.google.android.ext.') ||
        lower.startsWith('com.google.android.feedback') ||
        lower.startsWith('com.google.android.partnersetup') ||
        lower.startsWith('com.google.android.packageinstaller') ||
        lower.startsWith('com.google.android.onetimeinitializer') ||
        lower.startsWith('com.google.android.cellbroadcast') ||
        lower.startsWith('com.google.android.tts') ||
        lower.startsWith('com.google.android.inputmethod') ||
        lower.startsWith('com.google.android.networkstack') ||
        lower.startsWith('com.google.android.federatedcompute') ||
        lower.startsWith('com.google.android.health.connect.backuprestore') ||
        lower.startsWith('com.google.ambient.streaming') ||
        lower.startsWith('com.google.android.devicelockcontroller') ||
        lower.startsWith('com.facebook.appmanager') ||
        lower.startsWith('com.facebook.services') ||
        lower.startsWith('com.microsoft.appmanager')) {
      return true;
    }

    // Filter system overlays, keyboards, launchers
    if (lower.contains('overlay') ||
        lower.contains('inputmethod') ||
        lower.contains('frameworkres') ||
        lower.contains('telephony') ||
        lower.contains('launcher') ||
        lower.contains('systemui')) {
      return true;
    }

    // Filter our own debug app so it doesn't inflate stats while developing
    if (lower == 'com.mentalhealth.app.mental_health_mobile') {
      return true;
    }

    return false;
  }

  static ({String category, String icon}) _categorizeApp(String pkg, String name) {
    final lowerPkg = pkg.toLowerCase();
    final lowerName = name.toLowerCase();

    final combined = '$lowerPkg $lowerName';

    if (combined.contains('freefire') ||
        combined.contains('pubg') ||
        combined.contains('cod') ||
        combined.contains('game') ||
        combined.contains('roblox')) {
      return (category: 'Gaming', icon: '🎮');
    }
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
    final lowerPkg = pkg.toLowerCase();
    if (lowerPkg.contains('freefire')) return 'Free Fire MAX';
    if (lowerPkg.contains('instagram')) return 'Instagram';
    if (lowerPkg.contains('whatsapp')) return 'WhatsApp';
    if (lowerPkg.contains('youtube.music')) return 'YouTube Music';
    if (lowerPkg.contains('youtube')) return 'YouTube';
    if (lowerPkg.contains('chrome')) return 'Chrome';
    if (lowerPkg.contains('spotify')) return 'Spotify';
    if (lowerPkg.contains('netflix')) return 'Netflix';

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
