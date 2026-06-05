import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'widgets/applications_tab_view.dart';
import 'widgets/connect_gmail_view.dart';
import 'widgets/dashboard_syncing_view.dart';
import 'widgets/synced_dashboard_view.dart';

class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        final state = AppSyncState.instance;
        if (!state.hasSyncedData) {
          if (state.syncButtonState == SyncButtonState.syncing) {
            return const DashboardSyncingView();
          }
          return const ConnectGmailView();
        }
        return const SyncedDashboardView();
      },
    );
  }
}

class ApplicationsTab extends StatelessWidget {
  const ApplicationsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const ApplicationsTabView();
  }
}

class ActivityTab extends StatelessWidget {
  const ActivityTab({super.key});

  @override
  Widget build(BuildContext context) {
    return const _EmptyDataPlaceholder(
      icon: Icons.notifications_outlined,
      title: 'Activity',
      message: 'Recent inbox updates will appear here after your first sync.',
    );
  }
}

class _EmptyDataPlaceholder extends StatelessWidget {
  const _EmptyDataPlaceholder({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        final hasData = AppSyncState.instance.hasSyncedData;
        return ColoredBox(
          color: AppColors.dashboardBackground,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    icon,
                    size: 48,
                    color: AppColors.secondary.withValues(alpha: 0.5),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    title,
                    style: AppTextStyles.darkGreeting.copyWith(fontSize: 22),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    hasData
                        ? 'No $title data yet.'
                        : message,
                    textAlign: TextAlign.center,
                    style: AppTextStyles.darkSubtitle,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
