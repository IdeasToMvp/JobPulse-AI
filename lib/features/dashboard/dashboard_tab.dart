import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import 'widgets/activity_tab_view.dart';
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
    return const ActivityTabView();
  }
}
