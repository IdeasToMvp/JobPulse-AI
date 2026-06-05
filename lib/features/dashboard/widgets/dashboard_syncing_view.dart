import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/glass_card.dart';

class DashboardSyncingView extends StatelessWidget {
  const DashboardSyncingView({super.key});

  static const _steps = [
    _SyncStep('Connecting to Gmail', 'Verifying secure access'),
    _SyncStep(
      'Scanning job platforms',
      'LinkedIn, Naukri, Indeed, and your other sources',
    ),
    _SyncStep(
      'Building company list',
      'Identifying employers from platform emails',
    ),
    _SyncStep(
      'Searching company emails',
      'Recruiter replies and company domain mail',
    ),
    _SyncStep('Updating dashboard', 'Computing stats and refreshing snapshot'),
  ];

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        final state = AppSyncState.instance;
        final stepIndex = state.syncProgressStepIndex;
        final isSyncing = state.syncButtonState == SyncButtonState.syncing;
        final isDone =
            state.syncStep == SyncStep.complete ||
            state.syncButtonState == SyncButtonState.success;
        final progress = state.syncProgressFraction.clamp(0.0, 1.0);
        final progressPercent = (progress * 100).round().clamp(0, 100);

        final taskLabel = _taskLabel(state);

        return ColoredBox(
          color: AppColors.dashboardBackground,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'JobPulse AI is scanning your inbox in two phases: job platforms first, then company and recruiter mail.',
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
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  taskLabel,
                                  style: AppTextStyles.darkSectionTitle
                                      .copyWith(fontSize: 20),
                                ),
                                if (state.syncStepDetail != null) ...[
                                  const SizedBox(height: 6),
                                  Text(
                                    state.syncStepDetail!,
                                    style: AppTextStyles.darkStatCaption
                                        .copyWith(height: 1.35),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          if (isSyncing && !isDone)
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
                        child: LinearProgressIndicator(
                          value: isDone ? 1 : (isSyncing ? null : progress),
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
                  'SYNC PROGRESS',
                  style: AppTextStyles.darkCardTag.copyWith(
                    letterSpacing: 1.2,
                    fontSize: 10,
                  ),
                ),
                const SizedBox(height: 12),
                ...List.generate(_steps.length, (index) {
                  final step = _steps[index];
                  final done = isDone || index < stepIndex;
                  final active =
                      !isDone && index == stepIndex && isSyncing;
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
                if (isSyncing && !isDone) ...[
                  const SizedBox(height: 20),
                  OutlinedButton.icon(
                    onPressed: () => _stopSync(context),
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
                'Stopping tells the server to halt immediately and saves '
                'whatever was processed so far.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.darkStatCaption.copyWith(height: 1.35),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  String _taskLabel(AppSyncState state) {
    if (state.syncStep == SyncStep.complete ||
        state.syncButtonState == SyncButtonState.success) {
      return 'Sync complete';
    }

    switch (state.syncStep) {
      case SyncStep.connecting:
        return 'Connecting to Gmail…';
      case SyncStep.scanningPlatforms:
        return 'Scanning job platforms…';
      case SyncStep.discoveringCompanies:
        return 'Building company list…';
      case SyncStep.searchingCompanyEmails:
        return 'Searching company emails…';
      case SyncStep.finalizing:
        return 'Updating dashboard…';
      case SyncStep.idle:
        return 'Preparing sync…';
      case SyncStep.complete:
        return 'Sync complete';
    }
  }

  Future<void> _stopSync(BuildContext context) async {
    await AppSyncState.instance.cancelSync();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Sync stopped. Saving progress and updating your dashboard…',
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
