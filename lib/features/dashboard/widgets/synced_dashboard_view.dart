import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/glass_card.dart';
import '../models/dashboard_data.dart';
import 'dashboard_sync_button.dart';
import 'dashboard_syncing_view.dart';

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
            _buildStatsGrid(),
            const SizedBox(height: 20),
            _buildAiInsight(),
            const SizedBox(height: 22),
            _buildNeedsAttention(),
            const SizedBox(height: 22),
            _buildRecentActivity(),
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
                  onPressed: () => AppSyncState.instance.runSync(),
                ),
                Text(
                  'Last sync: ${state.lastSyncLabel}',
                  style: AppTextStyles.darkStatCaption.copyWith(fontSize: 10),
                ),
              ],
            ),
            Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  onPressed: () {},
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(
                    minWidth: 40,
                    minHeight: 40,
                  ),
                  icon: const Icon(
                    Icons.notifications_outlined,
                    color: AppColors.onboardingTitle,
                  ),
                ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 7,
                    height: 7,
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                  ),
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
    const stats = DashboardStats.sample;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _statCard(
                icon: Icons.description_outlined,
                iconColor: const Color(0xFF60A5FA),
                tag: 'ALL',
                value: '${stats.applications}',
                label: 'Applications',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _statCard(
                icon: Icons.bolt_rounded,
                iconColor: AppColors.secondary,
                tag: 'LIVE',
                value: '${stats.active}',
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
                tag: 'STAGE 3',
                value: '${stats.interviews}',
                label: 'Interviews',
                accentColor: AppColors.warning,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _statCard(
                icon: Icons.verified_rounded,
                iconColor: AppColors.success,
                tag: 'GOAL',
                value: '${stats.offers}',
                label: 'Offers',
                accentColor: AppColors.success,
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
    required String tag,
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
              Row(
                children: [
                  Icon(icon, color: iconColor, size: 18),
                  const Spacer(),
                  Text(
                    tag,
                    style: AppTextStyles.darkCardTag.copyWith(
                      color: AppColors.dashboardMuted,
                    ),
                  ),
                ],
              ),
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

  Widget _buildAiInsight() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.lightbulb_outline_rounded,
                color: AppColors.secondary.withValues(alpha: 0.9),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                'AI Insight',
                style: AppTextStyles.benefitsHeader.copyWith(
                  color: AppColors.secondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          RichText(
            text: TextSpan(
              style: AppTextStyles.darkSubtitle.copyWith(height: 1.45),
              children: [
                const TextSpan(
                  text: 'Your highest interview success rate comes from ',
                ),
                TextSpan(
                  text: 'LinkedIn applications.',
                  style: TextStyle(
                    color: AppColors.secondary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNeedsAttention() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Needs Attention', style: AppTextStyles.darkSectionTitle),
        const SizedBox(height: 12),
        ...AttentionItem.sample.map(_attentionCard),
      ],
    );
  }

  Widget _attentionCard(AttentionItem item) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Opacity(
        opacity: item.dimmed ? 0.45 : 1,
        child: GlassCard(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: item.iconColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: item.iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: AppTextStyles.featureTitle.copyWith(
                        color: AppColors.onboardingTitle,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(item.subtitle, style: AppTextStyles.darkStatCaption),
                  ],
                ),
              ),
              if (item.tag != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (item.tagColor ?? AppColors.secondary)
                        .withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    item.tag!,
                    style: AppTextStyles.darkCardTag.copyWith(
                      color: item.tagColor ?? AppColors.secondary,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentActivity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Recent Activity', style: AppTextStyles.darkSectionTitle),
            const Spacer(),
            Text(
              'View All',
              style: TextStyle(
                color: AppColors.secondary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        ...List.generate(ActivityItem.sample.length, (index) {
          final item = ActivityItem.sample[index];
          return _activityRow(item, showLine: index < ActivityItem.sample.length - 1);
        }),
      ],
    );
  }

  Widget _activityRow(ActivityItem item, {required bool showLine}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 14,
          child: Column(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.secondary,
                  shape: BoxShape.circle,
                ),
              ),
              if (showLine)
                Container(
                  width: 2,
                  height: 36,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  color: AppColors.loginDivider,
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: AppTextStyles.featureTitle.copyWith(
                    color: AppColors.onboardingTitle,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(item.timeAgo, style: AppTextStyles.darkStatCaption),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
