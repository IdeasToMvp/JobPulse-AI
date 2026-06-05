import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
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

  Timer? _tickTimer;
  DateTime? _startedAt;
  int _visualCompletedSteps = 0;
  double _visualProgress = 0.12;

  @override
  void initState() {
    super.initState();
    _startedAt = DateTime.now();
    AppSyncState.instance.addListener(_onSyncStateChanged);
    _tickTimer = Timer.periodic(const Duration(milliseconds: 400), (_) {
      if (!mounted) return;
      _updateVisualProgress();
    });
  }

  @override
  void dispose() {
    _tickTimer?.cancel();
    AppSyncState.instance.removeListener(_onSyncStateChanged);
    super.dispose();
  }

  void _onSyncStateChanged() {
    if (!mounted) return;
    setState(_updateVisualProgress);
  }

  bool get _isSyncing =>
      AppSyncState.instance.syncButtonState == SyncButtonState.syncing;

  bool get _isDone =>
      AppSyncState.instance.syncButtonState == SyncButtonState.success;

  Future<void> _stopSync() async {
    AppSyncState.instance.cancelSync();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Sync stopped. Saving progress and updating your dashboard…',
        ),
      ),
    );
  }

  void _updateVisualProgress() {
    if (_isDone) {
      _visualProgress = 1;
      _visualCompletedSteps = _steps.length;
      return;
    }

    if (!_isSyncing) return;

    final elapsed = DateTime.now().difference(_startedAt ?? DateTime.now());
    final seconds = elapsed.inMilliseconds / 1000;

    // Cap at 88% until the backend POST /sync actually returns.
    _visualProgress = (0.12 + (seconds / 120) * 0.76).clamp(0.12, 0.88);

    if (seconds < 2) {
      _visualCompletedSteps = 0;
    } else if (seconds < 8) {
      _visualCompletedSteps = 1;
    } else if (seconds < 20) {
      _visualCompletedSteps = 2;
    } else {
      _visualCompletedSteps = 3;
    }
  }

  String get _taskLabel {
    if (_isDone) return 'Sync complete';
    if (!_isSyncing) return 'Preparing sync...';

    switch (_visualCompletedSteps) {
      case 0:
        return 'Connecting to Gmail...';
      case 1:
        return 'Scanning inbox...';
      case 2:
        return 'Processing job emails...';
      default:
        return 'Still scanning — this may take a minute';
    }
  }

  @override
  Widget build(BuildContext context) {
    _updateVisualProgress();
    final progressPercent = (_visualProgress * 100).round().clamp(0, 100);
    final showLongRunningHint =
        _isSyncing && _visualCompletedSteps >= 3 && _visualProgress >= 0.85;

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
                      if (_isSyncing && !_isDone)
                        const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.secondary,
                          ),
                        )
                      else
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
                    child: _isSyncing && !_isDone
                        ? const LinearProgressIndicator(
                            minHeight: 8,
                            backgroundColor: AppColors.platformsProgressTrack,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              AppColors.secondary,
                            ),
                          )
                        : LinearProgressIndicator(
                            value: _visualProgress,
                            minHeight: 8,
                            backgroundColor: AppColors.platformsProgressTrack,
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AppColors.secondary,
                            ),
                          ),
                  ),
                  if (showLongRunningHint) ...[
                    const SizedBox(height: 12),
                    Text(
                      'Your emails are being filtered and classified on the server. '
                      'Stats appear when the scan finishes or when you stop sync.',
                      style: AppTextStyles.darkStatCaption.copyWith(height: 1.4),
                    ),
                  ],
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
              final done = index < _visualCompletedSteps;
              final active = index == _visualCompletedSteps && _isSyncing && !done;
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
            if (_isSyncing && !_isDone) ...[
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: _stopSync,
                icon: const Icon(Icons.stop_circle_outlined, size: 18),
                label: const Text('Stop sync'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Stopping saves emails processed so far and refreshes your '
                'dashboard with partial results.',
                textAlign: TextAlign.center,
                style: AppTextStyles.darkStatCaption.copyWith(height: 1.35),
              ),
            ],
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
