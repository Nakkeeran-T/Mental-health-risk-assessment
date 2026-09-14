import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../context/auth_context.dart';
import '../components/server_config_dialog.dart';
import '../theme/app_theme.dart';
import 'login_page.dart';
import 'history_page.dart';
import 'wearable_page.dart';
import 'chat_page.dart';

class ProfilePage extends StatefulWidget {
  final VoidCallback? onToggleTheme;
  final bool isDarkMode;

  const ProfilePage({
    super.key,
    this.onToggleTheme,
    this.isDarkMode = false,
  });

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String _currentBaseUrl = '';

  @override
  void initState() {
    super.initState();
    _loadBaseUrl();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthContext>().fetchCurrentUser();
    });
  }

  void _loadBaseUrl() {
    ApiClient().getBaseUrl().then((url) {
      if (mounted) setState(() => _currentBaseUrl = url);
    });
  }

  void _handleLogout() async {
    final auth = context.read<AuthContext>();
    await auth.logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthContext>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final user = auth.user;
    final name = user?.displayName ?? 'Guest User';
    final email = (user != null && user.email.isNotEmpty) ? user.email : 'guest@example.com';
    final role = user?.role ?? 'USER';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile & Settings'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // User Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.cardDark : Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'U',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            email,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              role,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Health Records & Devices Section
              const Text(
                'My Health Records & Devices',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              Material(
                color: isDark ? AppTheme.cardDark : Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: BorderSide(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    ListTile(
                      leading: const Icon(Icons.history_rounded, color: AppTheme.primary),
                      title: const Text('Assessment History Records', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      subtitle: Text(
                        'View past screening evaluations and clinical trends',
                        style: TextStyle(fontSize: 12, color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const HistoryPage()),
                        );
                      },
                    ),
                    Divider(height: 1, color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
                    ListTile(
                      leading: const Icon(Icons.watch_rounded, color: AppTheme.calmingBlue),
                      title: const Text('Smartwatch Health Sync', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      subtitle: Text(
                        'Sync Apple Watch, Garmin, or Fitbit biometric telemetry',
                        style: TextStyle(fontSize: 12, color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const WearablePage()),
                        );
                      },
                    ),
                    Divider(height: 1, color: isDark ? AppTheme.borderDark : AppTheme.borderLight),
                    ListTile(
                      leading: const Icon(Icons.forum_rounded, color: AppTheme.accent),
                      title: const Text('AI Companion Chat History', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      subtitle: Text(
                        'Review past empathetic conversations and reflections',
                        style: TextStyle(fontSize: 12, color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                      ),
                      trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ChatPage(initialOpenHistory: true)),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Settings Section
              const Text(
                'Application Settings',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              // Server URL tile
              Material(
                color: isDark ? AppTheme.cardDark : Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: BorderSide(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const Icon(Icons.dns_rounded, color: AppTheme.primary),
                  title: const Text('Backend API URL', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  subtitle: Text(
                    _currentBaseUrl.isEmpty ? 'Configuring...' : _currentBaseUrl,
                    style: TextStyle(fontSize: 12, color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                  ),
                  trailing: const Icon(Icons.edit_outlined, size: 18),
                  onTap: () => showServerConfigDialog(context, onUrlUpdated: _loadBaseUrl),
                ),
              ),
              const SizedBox(height: 10),

              // Dark Theme Switch Tile
              if (widget.onToggleTheme != null) ...[
                Material(
                  color: isDark ? AppTheme.cardDark : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(
                      color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: SwitchListTile(
                    secondary: Icon(
                      widget.isDarkMode ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                      color: AppTheme.accent,
                    ),
                    title: const Text('Dark Mode', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    subtitle: Text(
                      widget.isDarkMode ? 'Calming dark aesthetic enabled' : 'Clean light theme enabled',
                      style: TextStyle(fontSize: 12, color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight),
                    ),
                    value: widget.isDarkMode,
                    onChanged: (_) => widget.onToggleTheme!(),
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // Sign Out Tile
              Material(
                color: isDark ? AppTheme.cardDark : Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(18),
                  side: BorderSide(
                    color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const Icon(Icons.logout_rounded, color: AppTheme.riskHigh),
                  title: const Text(
                    'Sign Out',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: AppTheme.riskHigh,
                    ),
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                  onTap: _handleLogout,
                ),
              ),
              const SizedBox(height: 32),

              // About info
              Center(
                child: Column(
                  children: [
                    Text(
                      'MindCare v1.0.0',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Privacy-First Mental Health Risk Assessment Platform',
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
      ),
    );
  }
}
