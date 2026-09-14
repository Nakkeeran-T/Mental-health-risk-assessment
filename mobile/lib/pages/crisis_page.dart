import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../components/crisis_card.dart';
import '../theme/app_theme.dart';
import 'breathing_page.dart';

class CrisisPage extends StatelessWidget {
  const CrisisPage({super.key});

  Future<void> _callEmergency() async {
    final uri = Uri.parse('tel:112');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Crisis Support & SOS'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Emergency 112 Banner
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFCA5A5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Text('🚨', style: TextStyle(fontSize: 24)),
                        SizedBox(width: 10),
                        Text(
                          'If you are in immediate danger',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF991B1B),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please call 112 (National Emergency Helpline) or go to your nearest emergency room immediately.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF7F1D1D),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 14),
                    ElevatedButton.icon(
                      onPressed: _callEmergency,
                      icon: const Icon(Icons.emergency_rounded, size: 18),
                      label: const Text('Call 112 (Emergency Services)'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Helplines Section
              const Text(
                'Confidential 24/7 Crisis Helplines',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),

              const CrisisCard(
                name: 'iCall — TISS',
                number: '9152987821',
                description: 'Psychological counselling by trained mental health professionals.',
                hours: 'Mon–Sat, 8:00 AM – 10:00 PM',
                iconEmoji: '📞',
              ),
              const CrisisCard(
                name: 'Vandrevala Foundation',
                number: '18602662345',
                description: '24/7 mental health helpline offering free clinical counselling and crisis support.',
                hours: '24 Hours / 7 Days a Week',
                iconEmoji: '🆘',
              ),
              const CrisisCard(
                name: 'SNEHI Suicide Prevention',
                number: '04424640050',
                description: 'Emotional crisis intervention and suicide prevention helpline.',
                hours: '24 Hours / 7 Days a Week',
                iconEmoji: '💚',
              ),
              const CrisisCard(
                name: '988 Suicide & Crisis Lifeline',
                number: '988',
                description: 'Free, confidential support for people in suicidal crisis or emotional distress.',
                hours: '24 Hours / 7 Days a Week',
                iconEmoji: '🛡️',
              ),

              const SizedBox(height: 24),

              // Grounding Technique Section
              const Text(
                '5-4-3-2-1 Grounding Technique',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'When panic or intense anxiety hits, use your senses to bring your mind back into the present moment.',
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 14),

              _buildGroundingStep('5', '👀 SEE', 'Acknowledge 5 things that you see around you right now.', isDark),
              _buildGroundingStep('4', '✋ TOUCH', 'Acknowledge 4 things you can feel (your clothes, chair, feet on ground).', isDark),
              _buildGroundingStep('3', '👂 HEAR', 'Acknowledge 3 things you hear around you (birds, clock, traffic, wind).', isDark),
              _buildGroundingStep('2', '👃 SMELL', 'Acknowledge 2 things you can smell (or two scents you like).', isDark),
              _buildGroundingStep('1', '👅 TASTE', 'Acknowledge 1 thing you can taste, or take a slow sip of cool water.', isDark),

              const SizedBox(height: 20),

              OutlinedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const BreathingPage()),
                  );
                },
                icon: const Icon(Icons.air_rounded),
                label: const Text('Practice Deep Breathing Exercises'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGroundingStep(String number, String header, String text, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppTheme.borderDark : AppTheme.borderLight,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: AppTheme.primary.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                number,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  header,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  text,
                  style: TextStyle(
                    fontSize: 12.5,
                    height: 1.35,
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
