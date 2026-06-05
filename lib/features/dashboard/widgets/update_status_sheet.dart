import 'package:flutter/material.dart';

import 'active_details_sheet.dart';
import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/models/application_status.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
typedef StatusUpdateCallback = void Function(ApplicationDetail detail);

class UpdateStatusSheet extends StatefulWidget {
  const UpdateStatusSheet({
    super.key,
    required this.application,
    this.onUpdated,
  });

  final JobApplication application;
  final StatusUpdateCallback? onUpdated;

  static Future<void> show(
    BuildContext context, {
    required JobApplication application,
    StatusUpdateCallback? onUpdated,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => UpdateStatusSheet(
        application: application,
        onUpdated: onUpdated,
      ),
    );
  }

  @override
  State<UpdateStatusSheet> createState() => _UpdateStatusSheetState();
}

class _UpdateStatusSheetState extends State<UpdateStatusSheet> {
  String? _selectedStatus;
  bool _submitting = false;

  Future<void> _confirmAndSubmit(String status) async {
    if (status == widget.application.status) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.white,
        title: const Text('Update status?'),
        content: Text(
          'Change status from ${formatStatusLabel(widget.application.status)} '
          'to ${formatStatusLabel(status)}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Update'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    if (status == 'active' && widget.application.status != 'active') {
      await ActiveDetailsSheet.show(
        context,
        application: widget.application,
        onUpdated: (detail) {
          widget.onUpdated?.call(detail);
        },
      );
      return;
    }

    setState(() {
      _submitting = true;
      _selectedStatus = status;
    });

    try {
      final result = await UserApi.instance.updateApplicationStatus(
        widget.application.id,
        status,
      );
      AppSyncState.instance.applySyncFromStatusUpdate(result.sync);
      AppSyncState.instance.bumpFeedRevision();
      widget.onUpdated?.call(result.application);
      if (mounted) Navigator.of(context).pop();
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to update status')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _submitting = false;
          _selectedStatus = null;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = widget.application.status;

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
          const SizedBox(height: 20),
          Text(
            'Update Status',
            style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 4),
          Text(
            widget.application.company,
            style: AppTextStyles.darkSubtitle,
          ),
          const SizedBox(height: 16),
          ...manualApplicationStatuses.map((status) {
            final selected = current == status;
            final color = statusColor(status);
            final loading = _submitting && _selectedStatus == status;

            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _submitting || selected
                      ? null
                      : () => _confirmAndSubmit(status),
                  borderRadius: BorderRadius.circular(14),
                  child: Ink(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: selected
                          ? color.withValues(alpha: 0.1)
                          : AppColors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: selected
                            ? color.withValues(alpha: 0.45)
                            : AppColors.platformsCardBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          selected
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                          color: selected ? color : AppColors.dashboardMuted,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            formatStatusLabel(status),
                            style: AppTextStyles.featureTitle.copyWith(
                              fontSize: 14,
                              color: selected ? color : null,
                            ),
                          ),
                        ),
                        if (loading)
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: color,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
