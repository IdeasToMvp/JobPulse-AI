import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class DashboardSyncButton extends StatelessWidget {
  const DashboardSyncButton({super.key, required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        final state = AppSyncState.instance.syncButtonState;
        final isSyncing = state == SyncButtonState.syncing;
        final isSuccess = state == SyncButtonState.success;

        return Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: isSyncing ? null : onPressed,
            borderRadius: BorderRadius.circular(20),
            child: Ink(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: AppColors.loginSecurityBox,
                border: Border.all(
                  color: AppColors.secondary.withValues(alpha: 0.35),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isSyncing)
                    const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.secondary,
                      ),
                    )
                  else if (isSuccess)
                    const Icon(
                      Icons.check_rounded,
                      size: 16,
                      color: AppColors.success,
                    )
                  else
                    const Icon(
                      Icons.sync_rounded,
                      size: 16,
                      color: AppColors.secondary,
                    ),
                  const SizedBox(width: 6),
                  Text(
                    isSyncing
                        ? 'Syncing...'
                        : isSuccess
                            ? 'Updated'
                            : 'Sync',
                    style: AppTextStyles.darkCardTag.copyWith(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
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
