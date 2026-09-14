import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mental_health_mobile/main.dart';
import 'package:mental_health_mobile/context/auth_context.dart';
import 'package:mental_health_mobile/context/assessment_context.dart';
import 'package:mental_health_mobile/context/chat_context.dart';
import 'package:mental_health_mobile/context/wellness_context.dart';
import 'package:mental_health_mobile/context/wearable_context.dart';
import 'package:mental_health_mobile/pages/profile_page.dart';
import 'package:mental_health_mobile/pages/dashboard_page.dart';

void main() {
  testWidgets('MindCareApp smoke test renders login or main layout', (WidgetTester tester) async {
    await tester.pumpWidget(const MindCareApp());
    expect(find.byType(MindCareApp), findsOneWidget);
  });

  testWidgets('ProfilePage renders without error', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthContext()),
          ChangeNotifierProvider(create: (_) => AssessmentContext()),
          ChangeNotifierProvider(create: (_) => ChatContext()),
          ChangeNotifierProvider(create: (_) => WellnessContext()),
          ChangeNotifierProvider(create: (_) => WearableContext()),
        ],
        child: const MaterialApp(
          home: ProfilePage(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(ProfilePage), findsOneWidget);
  });

  testWidgets('DashboardPage renders and navigates to ProfilePage', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AuthContext()),
          ChangeNotifierProvider(create: (_) => AssessmentContext()),
          ChangeNotifierProvider(create: (_) => ChatContext()),
          ChangeNotifierProvider(create: (_) => WellnessContext()),
          ChangeNotifierProvider(create: (_) => WearableContext()),
        ],
        child: const MaterialApp(
          home: DashboardPage(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byType(DashboardPage), findsOneWidget);

    // Tap on greeting to navigate to profile page
    await tester.tap(find.byType(InkWell).first);
    await tester.pumpAndSettle();
    expect(find.byType(ProfilePage), findsOneWidget);
  });
}
