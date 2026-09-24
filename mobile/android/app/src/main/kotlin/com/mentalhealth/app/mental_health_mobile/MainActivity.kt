package com.mentalhealth.app.mental_health_mobile

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.Calendar

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.mentalhealth.app/digital_wellbeing"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "hasUsagePermission" -> {
                    result.success(hasUsageStatsPermission())
                }
                "openUsageSettings" -> {
                    try {
                        startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                        result.success(true)
                    } catch (e: Exception) {
                        result.error("SETTINGS_ERROR", e.message, null)
                    }
                }
                "getExactWellbeingData" -> {
                    try {
                        val startMillis = call.argument<Long>("start") ?: getTodayMidnight()
                        val endMillis = call.argument<Long>("end") ?: System.currentTimeMillis()
                        val data = computeExactScreenTime(startMillis, endMillis)
                        result.success(data)
                    } catch (e: Exception) {
                        result.error("ERROR", e.message, null)
                    }
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return false
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000 * 60 * 5, now)
        return stats != null && stats.isNotEmpty()
    }

    private fun getTodayMidnight(): Long {
        val cal = Calendar.getInstance()
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    private fun isSystemOrInternalPackage(pkg: String): Boolean {
        val lower = pkg.lowercase()
        val allowedUserApps = setOf(
            "com.google.android.youtube",
            "com.google.android.apps.youtube.music",
            "com.android.chrome",
            "com.google.android.apps.messaging",
            "com.google.android.gm",
            "com.google.android.apps.photos",
            "com.google.android.apps.maps",
            "com.google.android.apps.docs",
            "com.google.android.calendar",
            "com.google.android.keep"
        )
        if (allowedUserApps.contains(lower)) return false

        if (lower == packageName) return true // Exclude our own app from inflating screen time

        return lower.startsWith("com.oplus.") ||
                lower.startsWith("com.coloros.") ||
                lower.startsWith("com.heytap.") ||
                lower.startsWith("com.qualcomm.") ||
                lower.startsWith("com.mediatek.") ||
                lower.startsWith("vendor.") ||
                lower.startsWith("android.") ||
                lower.startsWith("com.android.internal") ||
                lower.startsWith("com.android.providers.") ||
                lower.startsWith("com.android.server.") ||
                lower.startsWith("com.android.bluetooth") ||
                lower.startsWith("com.android.systemui") ||
                lower.startsWith("com.android.settings") ||
                lower.startsWith("com.android.launcher") ||
                lower.startsWith("com.android.phone") ||
                lower.startsWith("com.android.stk") ||
                lower.startsWith("com.android.shell") ||
                lower.startsWith("com.android.nfc") ||
                lower.startsWith("com.android.location") ||
                lower.startsWith("com.android.companiondevicemanager") ||
                lower.startsWith("com.google.android.gms") ||
                lower.startsWith("com.google.android.gsf") ||
                lower.startsWith("com.google.android.ext.") ||
                lower.startsWith("com.google.android.feedback") ||
                lower.startsWith("com.google.android.partnersetup") ||
                lower.startsWith("com.google.android.packageinstaller") ||
                lower.startsWith("com.google.android.cellbroadcast") ||
                lower.startsWith("com.google.android.tts") ||
                lower.startsWith("com.google.android.inputmethod") ||
                lower.startsWith("com.google.android.networkstack") ||
                lower.startsWith("com.google.android.apps.wellbeing") ||
                lower.startsWith("com.facebook.appmanager") ||
                lower.startsWith("com.facebook.services") ||
                lower.startsWith("com.microsoft.appmanager") ||
                lower.contains("overlay") ||
                lower.contains("inputmethod") ||
                lower.contains("systemui") ||
                lower.contains("launcher")
    }

    private fun computeExactScreenTime(startMillis: Long, endMillis: Long): Map<String, Any> {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return emptyMap()

        val events = usm.queryEvents(startMillis, endMillis)
        val event = UsageEvents.Event()

        val appDurations = HashMap<String, Long>()
        var currentForegroundPackage: String? = null
        var currentResumeTime: Long = 0
        var screenInteractive: Boolean = true
        var totalScreenOnMs: Long = 0
        var lateNightScreenOnMs: Long = 0
        var unlockCount: Int = 0

        val cal = Calendar.getInstance()

        fun isLateNight(timeMs: Long): Boolean {
            cal.timeInMillis = timeMs
            val hour = cal.get(Calendar.HOUR_OF_DAY)
            return hour >= 23 || hour < 5
        }

        fun recordSession(pkg: String, startTime: Long, endTime: Long) {
            val duration = endTime - startTime
            if (duration <= 0) return

            if (!isSystemOrInternalPackage(pkg)) {
                appDurations[pkg] = (appDurations[pkg] ?: 0L) + duration
                totalScreenOnMs += duration
                if (isLateNight(startTime)) {
                    lateNightScreenOnMs += duration
                }
            }
        }

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val time = event.timeStamp

            when (event.eventType) {
                UsageEvents.Event.SCREEN_INTERACTIVE -> {
                    screenInteractive = true
                }
                UsageEvents.Event.SCREEN_NON_INTERACTIVE -> {
                    screenInteractive = false
                    val currPkg = currentForegroundPackage
                    if (currPkg != null && currentResumeTime > 0) {
                        recordSession(currPkg, currentResumeTime, time)
                        currentForegroundPackage = null
                        currentResumeTime = 0
                    }
                }
                UsageEvents.Event.KEYGUARD_HIDDEN -> {
                    unlockCount++
                }
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    val currPkg = currentForegroundPackage
                    if (currPkg != null && currentResumeTime > 0) {
                        recordSession(currPkg, currentResumeTime, time)
                    }
                    currentForegroundPackage = event.packageName
                    currentResumeTime = time
                }
                UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.ACTIVITY_STOPPED -> {
                    val currPkg = currentForegroundPackage
                    if (currPkg != null && currPkg == event.packageName && currentResumeTime > 0) {
                        recordSession(currPkg, currentResumeTime, time)
                        currentForegroundPackage = null
                        currentResumeTime = 0
                    }
                }
            }
        }

        // If an app is currently in foreground up to endMillis and screen is still active
        val finalPkg = currentForegroundPackage
        if (finalPkg != null && currentResumeTime > 0 && screenInteractive) {
            recordSession(finalPkg, currentResumeTime, endMillis)
        }

        val pm = packageManager
        val appsList = ArrayList<Map<String, Any>>()

        val sorted = appDurations.entries.sortedByDescending { it.value }
        for (entry in sorted) {
            val pkg = entry.key
            val durationMs = entry.value
            if (durationMs < 15000) continue // Skip under 15 seconds

            var appName: String = pkg
            try {
                val appInfo = pm.getApplicationInfo(pkg, 0)
                appName = pm.getApplicationLabel(appInfo).toString()
            } catch (_: Exception) {
                val parts = pkg.split(".")
                if (parts.isNotEmpty()) {
                    appName = parts.last().replaceFirstChar { it.uppercase() }
                }
            }

            appsList.add(mapOf(
                "packageName" to pkg,
                "appName" to appName,
                "durationSeconds" to (durationMs / 1000)
            ))
        }

        return mapOf(
            "totalScreenTimeSeconds" to (totalScreenOnMs / 1000),
            "lateNightScreenTimeSeconds" to (lateNightScreenOnMs / 1000),
            "unlockCount" to unlockCount,
            "apps" to appsList
        )
    }
}
