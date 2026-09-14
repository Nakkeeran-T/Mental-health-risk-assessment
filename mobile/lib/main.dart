import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'context/auth_context.dart';
import 'context/assessment_context.dart';
import 'context/chat_context.dart';
import 'context/wellness_context.dart';
import 'context/wearable_context.dart';
import 'context/digital_wellbeing_context.dart';
import 'pages/login_page.dart';
import 'pages/main_layout.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MindCareApp());
}

class MindCareApp extends StatefulWidget {
  const MindCareApp({super.key});

  @override
  State<MindCareApp> createState() => _MindCareAppState();
}

class _MindCareAppState extends State<MindCareApp> {
  ThemeMode _themeMode = ThemeMode.light;

  void _toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthContext()),
        ChangeNotifierProvider(create: (_) => AssessmentContext()),
        ChangeNotifierProvider(create: (_) => ChatContext()),
        ChangeNotifierProvider(create: (_) => WellnessContext()),
        ChangeNotifierProvider(create: (_) => WearableContext()),
        ChangeNotifierProvider(create: (_) => DigitalWellbeingContext()),
      ],
      child: MaterialApp(
        title: 'MindCare',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: _themeMode,
        home: Consumer<AuthContext>(
          builder: (ctx, auth, _) {
            if (!auth.isInitialized) {
              return const Scaffold(
                body: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('🌿', style: TextStyle(fontSize: 48)),
                      SizedBox(height: 16),
                      CircularProgressIndicator(strokeWidth: 2.5),
                    ],
                  ),
                ),
              );
            }
            // Check if user is authenticated or guest
            if (auth.isAuthenticated) {
              return MainLayout(
                onToggleTheme: _toggleTheme,
                isDarkMode: _themeMode == ThemeMode.dark,
              );
            }
            return const LoginPage();
          },
        ),
      ),
    );
  }
}
