import 'package:flutter/material.dart';

import '../../../core/api/sync_cancelled_exception.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'sync_prepare_sheet.dart';

class SyncOptionsSheet extends StatelessWidget {
  const SyncOptionsSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const SyncOptionsSheet(),
    );
  }

  Future<void> _runIncremental(BuildContext context) async {
    Navigator.of(context).pop();
    try {
      await AppSyncState.instance.runIncrementalSync();
    } on SyncCancelledException {
      // User stopped sync from the scanning screen.
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sync failed. Try again.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppSyncState.instance;
    final canIncremental = state.canRunIncrementalSync;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.paddingOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.loginDivider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Sync options',
            style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 6),
          Text(
            canIncremental
                ? 'Last sync: ${state.lastSyncLabel}'
                : 'Choose how you want to scan your inbox.',
            style: AppTextStyles.darkSubtitle,
          ),
          const SizedBox(height: 20),
          if (canIncremental) ...[
            _optionTile(
              icon: Icons.mark_email_unread_outlined,
              title: 'Sync new emails',
              subtitle: 'Only mail received since your last sync',
              onTap: () => _runIncremental(context),
            ),
            const SizedBox(height: 10),
          ],
          _optionTile(
            icon: Icons.history_rounded,
            title: 'Rescan email history',
            subtitle: 'Rescan the last 10 days of job emails',
            onTap: () {
              Navigator.of(context).pop();
              SyncPrepareSheet.show(context, onSyncStarted: () {});
            },
          ),
        ],
      ),
    );
  }

  Widget _optionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.platformsCardBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  color: AppColors.onboardingIconLavender,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 20, color: AppColors.secondary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AppTextStyles.darkStatCaption),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.dashboardMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
