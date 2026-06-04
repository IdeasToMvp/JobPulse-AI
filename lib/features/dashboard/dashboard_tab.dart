import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'widgets/connect_gmail_view.dart';
import 'widgets/synced_dashboard_view.dart';

class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        if (AppSyncState.instance.isGmailSynced) {
          return const SyncedDashboardView();
        }
        return const ConnectGmailView();
      },
    );
  }
}

class ApplicationsTab extends StatelessWidget {
  const ApplicationsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LightPlaceholder(
      icon: Icons.work_outline_rounded,
      title: 'Applications',
      message: 'Your tracked job applications will appear here.',
    );
  }
}

class ActivityTab extends StatelessWidget {
  const ActivityTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const _LightPlaceholder(
      icon: Icons.notifications_outlined,
      title: 'Activity',
      message: 'Recent inbox updates and alerts will appear here.',
    );
  }
}

class _LightPlaceholder extends StatelessWidget {
  const _LightPlaceholder({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.dashboardBackground,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 48, color: AppColors.secondary.withValues(alpha: 0.5)),
              const SizedBox(height: 16),
              Text(title, style: AppTextStyles.darkGreeting.copyWith(fontSize: 22)),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTextStyles.darkSubtitle,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
