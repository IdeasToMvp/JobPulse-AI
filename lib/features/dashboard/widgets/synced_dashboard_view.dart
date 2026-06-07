import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
import '../../../core/constants/platform_labels.dart';
import '../../../core/models/user_profile.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/glass_card.dart';
import 'dashboard_sync_button.dart';
import 'dashboard_syncing_view.dart';
import 'sync_options_sheet.dart';

class SyncedDashboardView extends StatelessWidget {
  const SyncedDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        final state = AppSyncState.instance;
        if (state.syncButtonState == SyncButtonState.syncing) {
          return const DashboardSyncingView();
        }
        return _DashboardContent(state: state);
      },
    );
  }
}

class _DashboardContent extends StatelessWidget {
  const _DashboardContent({required this.state});

  final AppSyncState state;

  List<MapEntry<String, PlatformSyncStats>> get _platformEntries {
    return state.sync.byPlatform.entries
        .where(
          (e) =>
              e.value.emailsProcessed > 0 || e.value.applicationsCount > 0,
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final firstName = state.userName.split(' ').first;

    return ColoredBox(
      color: AppColors.dashboardBackground,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildGreetingHeader(context, firstName),
            const SizedBox(height: 20),
            if (state.showNoResultsMessage) ...[
              _buildNoResultsCard(),
            ] else ...[
              _buildStatsGrid(),
              if (_platformEntries.isNotEmpty) ...[
                const SizedBox(height: 20),
                _buildPlatformBreakdown(),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildGreetingHeader(BuildContext context, String firstName) {
    final hour = DateTime.now().hour;
    final period = hour < 12
        ? 'Morning'
        : hour < 17
            ? 'Afternoon'
            : 'Evening';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.primary.withValues(alpha: 0.15),
              child: Text(
                firstName.isNotEmpty ? firstName[0] : 'J',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
            ),
            const Spacer(),
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                DashboardSyncButton(
                  onPressed: () => SyncOptionsSheet.show(context),
                ),
                Text(
                  'Last sync: ${state.lastSyncLabel}',
                  style: AppTextStyles.darkStatCaption.copyWith(fontSize: 10),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 14),
        Text(
          'Good $period, $firstName 👋',
          style: AppTextStyles.darkGreeting.copyWith(fontSize: 22),
        ),
        const SizedBox(height: 4),
        Text(
          "Here's your job search snapshot.",
          style: AppTextStyles.darkSubtitle,
        ),
      ],
    );
  }

  Widget _buildStatsGrid() {
    final sync = state.sync;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _statCard(
                icon: Icons.send_outlined,
                iconColor: const Color(0xFF60A5FA),
                value: '${sync.appliedCount}',
                label: 'Applied',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _statCard(
                icon: Icons.bolt_rounded,
                iconColor: AppColors.secondary,
                value: '${sync.activeCount}',
                label: 'Active',
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _statCard(
                icon: Icons.calendar_month_outlined,
                iconColor: AppColors.warning,
                value: '${sync.interviewsCount}',
                label: 'Interviews',
                accentColor: AppColors.warning,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _statCard(
                icon: Icons.verified_rounded,
                iconColor: AppColors.success,
                value: '${sync.offersCount}',
                label: 'Offers',
                accentColor: AppColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _statCard(
                icon: Icons.cancel_outlined,
                iconColor: AppColors.error,
                value: '${sync.rejectedCount}',
                label: 'Rejected',
                accentColor: AppColors.error,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _statCard(
                icon: Icons.visibility_off_outlined,
                iconColor: AppColors.dashboardMuted,
                value: '${sync.ghostedCount}',
                label: 'Ghosted',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _statCard({
    required IconData icon,
    required Color iconColor,
    required String value,
    required String label,
    Color? accentColor,
  }) {
    return GlassCard(
      padding: const EdgeInsets.all(14),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: accentColor != null
              ? Border(left: BorderSide(color: accentColor, width: 3))
              : null,
        ),
        child: Padding(
          padding: EdgeInsets.only(left: accentColor != null ? 10 : 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: iconColor, size: 18),
              const SizedBox(height: 12),
              Text(value, style: AppTextStyles.darkStatValue),
              const SizedBox(height: 4),
              Text(label, style: AppTextStyles.darkStatCaption),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlatformBreakdown() {
    final entries = _platformEntries;
    return GlassCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('By job source', style: AppTextStyles.featureTitle),
          const SizedBox(height: 12),
          for (var i = 0; i < entries.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: Text(
                    platformLabel(entries[i].key),
                    style: AppTextStyles.featureTitle.copyWith(fontSize: 13),
                  ),
                ),
                Text(
                  '${entries[i].value.emailsProcessed} emails',
                  style: AppTextStyles.darkStatCaption,
                ),
                const SizedBox(width: 12),
                Text(
                  '${entries[i].value.applicationsCount} apps',
                  style: AppTextStyles.darkStatCaption,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildNoResultsCard() {
    return GlassCard(
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppColors.secondary.withValues(alpha: 0.8),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Sync completed. No job-related emails were found for your '
              'selected sources in the last 10 days. Try different sources or '
              'use Sync new emails after more mail arrives.',
              style: AppTextStyles.darkSubtitle.copyWith(height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}
