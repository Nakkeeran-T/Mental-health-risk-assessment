import 'dart:async';
import 'package:flutter/material.dart';
import '../components/breathing_orb.dart';
import '../components/custom_button.dart';
import '../theme/app_theme.dart';

class BreathingStep {
  final String name;
  final int duration;
  final double targetScale; // 1.0 = full expand, 0.7 = shrink

  const BreathingStep({
    required this.name,
    required this.duration,
    required this.targetScale,
  });
}

class BreathingTechnique {
  final String id;
  final String title;
  final String description;
  final List<BreathingStep> steps;

  const BreathingTechnique({
    required this.id,
    required this.title,
    required this.description,
    required this.steps,
  });
}

class BreathingPage extends StatefulWidget {
  const BreathingPage({super.key});

  @override
  State<BreathingPage> createState() => _BreathingPageState();
}

class _BreathingPageState extends State<BreathingPage> {
  static const List<BreathingTechnique> _techniques = [
    BreathingTechnique(
      id: 'box',
      title: 'Box Breathing',
      description: 'Used by elite responders for instant stress relief and situational calm.',
      steps: [
        BreathingStep(name: 'Breathe In Slowly', duration: 4, targetScale: 1.0),
        BreathingStep(name: 'Hold Gently', duration: 4, targetScale: 1.0),
        BreathingStep(name: 'Exhale Completely', duration: 4, targetScale: 0.7),
        BreathingStep(name: 'Hold Still', duration: 4, targetScale: 0.7),
      ],
    ),
    BreathingTechnique(
      id: '478',
      title: '4-7-8 Deep Calm',
      description: 'Acts as a natural tranquilizer for the nervous system, reducing anxiety.',
      steps: [
        BreathingStep(name: 'Inhale Through Nose', duration: 4, targetScale: 1.0),
        BreathingStep(name: 'Hold Full Breath', duration: 7, targetScale: 1.0),
        BreathingStep(name: 'Exhale With Sigh', duration: 8, targetScale: 0.7),
      ],
    ),
    BreathingTechnique(
      id: 'equal',
      title: 'Equal Balance',
      description: 'Balances rhythm, regulates heart rate, and clears mental chatter.',
      steps: [
        BreathingStep(name: 'Inhale Smoothly', duration: 5, targetScale: 1.0),
        BreathingStep(name: 'Exhale Smoothly', duration: 5, targetScale: 0.7),
      ],
    ),
  ];

  int _selectedTechIdx = 0;
  bool _isActive = false;
  int _currentStepIdx = 0;
  int _secondsLeft = 4;
  int _completedCycles = 0;
  Timer? _timer;

  BreathingTechnique get _currentTech => _techniques[_selectedTechIdx];
  BreathingStep get _currentStep => _currentTech.steps[_currentStepIdx];

  @override
  void initState() {
    super.initState();
    _secondsLeft = _currentStep.duration;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _toggleActive() {
    if (_isActive) {
      _timer?.cancel();
      setState(() => _isActive = false);
    } else {
      setState(() => _isActive = true);
      _startTimer();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;

      setState(() {
        if (_secondsLeft <= 1) {
          final nextIdx = (_currentStepIdx + 1) % _currentTech.steps.length;
          if (nextIdx == 0) {
            _completedCycles++;
          }
          _currentStepIdx = nextIdx;
          _secondsLeft = _currentTech.steps[nextIdx].duration;
        } else {
          _secondsLeft--;
        }
      });
    });
  }

  void _switchTechnique(int idx) {
    _timer?.cancel();
    setState(() {
      _selectedTechIdx = idx;
      _isActive = false;
      _currentStepIdx = 0;
      _secondsLeft = _techniques[idx].steps[0].duration;
      _completedCycles = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Breathing Exercises'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // Technique Selector Chips
              SizedBox(
                height: 40,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _techniques.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (ctx, i) {
                    final isSelected = i == _selectedTechIdx;
                    return ChoiceChip(
                      label: Text(_techniques[i].title),
                      selected: isSelected,
                      selectedColor: AppTheme.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      ),
                      onSelected: (_) => _switchTechnique(i),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),

              Text(
                _currentTech.description,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight,
                ),
              ),
              const SizedBox(height: 16),

              // Animated Orb scaled to fit any device height
              Expanded(
                child: Center(
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: BreathingOrb(
                      scale: _isActive ? _currentStep.targetScale : 0.85,
                      instruction: _isActive ? _currentStep.name : 'Tap Start Below',
                      secondsRemaining: _secondsLeft,
                      techniqueName: _currentTech.title,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Completed Cycles Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'Completed Cycles: $_completedCycles',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Controls
              Row(
                children: [
                  Expanded(
                    child: CustomButton(
                      text: _isActive ? 'Pause' : 'Begin Breathing',
                      icon: _isActive ? Icons.pause_rounded : Icons.play_arrow_rounded,
                      onPressed: _toggleActive,
                    ),
                  ),
                  if (_completedCycles > 0 || _isActive) ...[
                    const SizedBox(width: 12),
                    IconButton.outlined(
                      icon: const Icon(Icons.refresh_rounded),
                      tooltip: 'Reset',
                      onPressed: () => _switchTechnique(_selectedTechIdx),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
