import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/glass_card.dart';

class DashboardSyncingView extends StatefulWidget {
  const DashboardSyncingView({super.key});

  @override
  State<DashboardSyncingView> createState() => _DashboardSyncingViewState();
}

class _DashboardSyncingViewState extends State<DashboardSyncingView> {
  static const _steps = [
    _SyncStep('Connecting to Gmail', 'Verifying secure access'),
    _SyncStep('Scanning inbox', 'Looking for job-related emails'),
    _SyncStep('Matching job sources', 'Applying your platform preferences'),
    _SyncStep('Updating dashboard', 'Refreshing your snapshot'),
  ];

  int _completedSteps = 0;
  double _progress = 0.12;
  String _taskLabel = 'Starting Gmail sync...';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startSequence();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startSequence() {
    _timer = Timer.periodic(const Duration(milliseconds: 850), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_completedSteps < _steps.length) {
        setState(() {
          _completedSteps++;
          _progress = 0.2 + (_completedSteps / _steps.length) * 0.76;
          _taskLabel = _completedSteps < _steps.length
              ? 'Syncing Gmail...'
              : 'Finalizing dashboard...';
        });
      } else {
        setState(() => _progress = 1);
        timer.cancel();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final progressPercent = (_progress * 100).round().clamp(0, 100);

    return ColoredBox(
      color: AppColors.dashboardBackground,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'JobPulse AI is scanning your inbox using your selected job sources.',
              style: AppTextStyles.darkSubtitle.copyWith(height: 1.45),
            ),
            const SizedBox(height: 20),
            GlassCard(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CURRENT TASK',
                    style: AppTextStyles.darkCardTag.copyWith(
                      letterSpacing: 1.2,
                      fontSize: 10,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          _taskLabel,
                          style: AppTextStyles.darkSectionTitle.copyWith(
                            fontSize: 20,
                          ),
                        ),
                      ),
                      Text(
                        '$progressPercent%',
                        style: AppTextStyles.darkStatValue.copyWith(
                          fontSize: 26,
                          color: AppColors.secondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: _progress,
                      minHeight: 8,
                      backgroundColor: AppColors.platformsProgressTrack,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        AppColors.secondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
            Text(
              'LIVE INSIGHTS',
              style: AppTextStyles.darkCardTag.copyWith(
                letterSpacing: 1.2,
                fontSize: 10,
              ),
            ),
            const SizedBox(height: 12),
            ...List.generate(_steps.length, (index) {
              final step = _steps[index];
              final done = index < _completedSteps;
              final active = index == _completedSteps && !done;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _insightRow(
                  title: step.title,
                  subtitle: step.subtitle,
                  done: done,
                  active: active,
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _insightRow({
    required String title,
    required String subtitle,
    required bool done,
    bool active = false,
  }) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: done
                  ? AppColors.secondary.withValues(alpha: 0.15)
                  : active
                      ? AppColors.loginSecurityBox
                      : AppColors.platformsCardSelected,
              shape: BoxShape.circle,
              border: Border.all(
                color: done || active
                    ? AppColors.secondary.withValues(alpha: 0.35)
                    : AppColors.platformsCardBorder,
              ),
            ),
            child: done
                ? const Icon(
                    Icons.check_rounded,
                    size: 18,
                    color: AppColors.secondary,
                  )
                : active
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.secondary,
                        ),
                      )
                    : Icon(
                        Icons.sync_rounded,
                        size: 16,
                        color: AppColors.dashboardMuted.withValues(alpha: 0.6),
                      ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.featureTitle.copyWith(
                    color: done || active
                        ? AppColors.onboardingTitle
                        : AppColors.dashboardMuted,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 2),
                Text(subtitle, style: AppTextStyles.darkStatCaption),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SyncStep {
  const _SyncStep(this.title, this.subtitle);
  final String title;
  final String subtitle;
}
