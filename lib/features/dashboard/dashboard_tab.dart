import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import '../../core/theme/app_colors.dart';
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
    return const _PlaceholderTab(
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
    return const _PlaceholderTab(
      icon: Icons.notifications_outlined,
      title: 'Activity',
      message: 'Recent inbox updates and alerts will appear here.',
    );
  }
}

class AccountTab extends StatelessWidget {
  const AccountTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        return _PlaceholderTab(
          icon: Icons.person_outline_rounded,
          title: 'Account',
          message: AppSyncState.instance.isGmailSynced
              ? 'Gmail is connected. Account settings coming soon.'
              : 'Connect Gmail from Dashboard to start syncing.',
          action: AppSyncState.instance.isGmailSynced
              ? TextButton(
                  onPressed: AppSyncState.instance.reset,
                  child: const Text('Reset sync (dev)'),
                )
              : null,
        );
      },
    );
  }
}

class _PlaceholderTab extends StatelessWidget {
  const _PlaceholderTab({
    required this.icon,
    required this.title,
    required this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: AppColors.primary.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.onboardingTitle,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.dashboardMuted,
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: 16),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
