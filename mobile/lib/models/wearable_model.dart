class WearableBiometric {
  final int? id;
  final String deviceType;
  final String deviceModel;
  final double hrvRmssd;
  final int restingHeartRate;
  final int sleepMinutes;
  final int? deepSleepMinutes;
  final int? remSleepMinutes;
  final double sleepEfficiency;
  final int dailySteps;
  final int? stressScore;
  final int? sleepQualityScore;
  final DateTime syncedAt;
  final String statusMessage;

  WearableBiometric({
    this.id,
    required this.deviceType,
    required this.deviceModel,
    required this.hrvRmssd,
    required this.restingHeartRate,
    required this.sleepMinutes,
    this.deepSleepMinutes,
    this.remSleepMinutes,
    required this.sleepEfficiency,
    required this.dailySteps,
    this.stressScore,
    this.sleepQualityScore,
    DateTime? syncedAt,
    this.statusMessage = 'Connected & Synchronized',
  }) : syncedAt = syncedAt ?? DateTime.now();

  String get formattedSleepHours {
    final hrs = sleepMinutes ~/ 60;
    final mins = sleepMinutes % 60;
    return '${hrs}h ${mins}m';
  }

  factory WearableBiometric.fromJson(Map<String, dynamic> json) {
    DateTime syncDate = DateTime.now();
    if (json['syncedAt'] != null) {
      try {
        syncDate = DateTime.parse(json['syncedAt'].toString());
      } catch (_) {}
    }

    return WearableBiometric(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? ''),
      deviceType: json['deviceType'] ?? 'SMARTWATCH',
      deviceModel: json['deviceModel'] ?? 'Smartwatch',
      hrvRmssd: (json['hrvRmssd'] as num?)?.toDouble() ?? 42.0,
      restingHeartRate: (json['restingHeartRate'] as num?)?.toInt() ?? 64,
      sleepMinutes: (json['sleepMinutes'] as num?)?.toInt() ?? 450,
      deepSleepMinutes: (json['deepSleepMinutes'] as num?)?.toInt(),
      remSleepMinutes: (json['remSleepMinutes'] as num?)?.toInt(),
      sleepEfficiency: (json['sleepEfficiency'] as num?)?.toDouble() ?? 0.88,
      dailySteps: (json['dailySteps'] as num?)?.toInt() ?? 7200,
      stressScore: (json['stressScore'] as num?)?.toInt(),
      sleepQualityScore: (json['sleepQualityScore'] as num?)?.toInt(),
      syncedAt: syncDate,
      statusMessage: json['statusMessage'] ?? 'Connected & Synchronized',
    );
  }

  Map<String, dynamic> toSyncJson() => {
    'deviceType': deviceType,
    'deviceModel': deviceModel,
    'hrvRmssd': hrvRmssd,
    'restingHeartRate': restingHeartRate,
    'sleepMinutes': sleepMinutes,
    'deepSleepMinutes': deepSleepMinutes,
    'remSleepMinutes': remSleepMinutes,
    'sleepEfficiency': sleepEfficiency,
    'dailySteps': dailySteps,
  };
}

class WearableDevice {
  final String id;
  final String name;
  final String brand;
  final String icon;
  final String platform;
  final String protocol;
  final WearableBiometric defaultTelemetry;

  const WearableDevice({
    required this.id,
    required this.name,
    required this.brand,
    required this.icon,
    required this.platform,
    required this.protocol,
    required this.defaultTelemetry,
  });
}
