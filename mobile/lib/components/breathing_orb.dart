import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BreathingOrb extends StatelessWidget {
  final double scale; // 0.7 to 1.0
  final String instruction;
  final int secondsRemaining;
  final String techniqueName;

  const BreathingOrb({
    super.key,
    required this.scale,
    required this.instruction,
    required this.secondsRemaining,
    required this.techniqueName,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outermost glowing ripple
          AnimatedContainer(
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeInOut,
            width: 280 * scale,
            height: 280 * scale,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primary.withValues(alpha: 0.08),
            ),
          ),
          // Middle harmonic ripple
          AnimatedContainer(
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
            width: 230 * scale,
            height: 230 * scale,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.primaryLight.withValues(alpha: 0.18),
            ),
          ),
          // Core pulsing sphere
          AnimatedContainer(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
            width: 180 * scale,
            height: 180 * scale,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  AppTheme.primaryLight,
                  AppTheme.primary,
                  AppTheme.primaryDark,
                ],
                center: const Alignment(-0.2, -0.2),
              ),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.primary.withValues(alpha: 0.35),
                  blurRadius: 30,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$secondsRemaining',
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    height: 1.0,
                  ),
                ),
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    instruction,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      letterSpacing: 0.5,
                    ),
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
