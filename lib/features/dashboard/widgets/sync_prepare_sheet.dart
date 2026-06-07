import 'package:flutter/material.dart';

import '../../../core/api/sync_cancelled_exception.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/constants/platform_labels.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../platforms/models/job_platform.dart';
import '../../platforms/widgets/platform_card.dart';

const mvpSyncRangeDays = 10;

class SyncPrepareSheet extends StatefulWidget {
  const SyncPrepareSheet({
    super.key,
    required this.onSyncStarted,
    this.initialPlatformIds,
    this.skipSourcesStep = false,
  });

  final VoidCallback onSyncStarted;
  final Set<String>? initialPlatformIds;
  final bool skipSourcesStep;

  static Future<void> show(
    BuildContext context, {
    required VoidCallback onSyncStarted,
    Set<String>? initialPlatformIds,
    bool skipSourcesStep = false,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SyncPrepareSheet(
        onSyncStarted: onSyncStarted,
        initialPlatformIds: initialPlatformIds,
        skipSourcesStep: skipSourcesStep,
      ),
    );
  }

  @override
  State<SyncPrepareSheet> createState() => _SyncPrepareSheetState();
}

class _SyncPrepareSheetState extends State<SyncPrepareSheet> {
  late final Set<String> _selectedIds;

  @override
  void initState() {
    super.initState();
    _selectedIds = widget.initialPlatformIds != null
        ? Set<String>.from(widget.initialPlatformIds!)
        : Set<String>.from(AppSyncState.instance.selectedPlatformIds);
  }

  DateTime get _toDate => DateTime.now();

  DateTime get _fromDate =>
      _toDate.subtract(const Duration(days: mvpSyncRangeDays));

  String get _dateRangeLabel =>
      '${_formatDate(_fromDate)} → ${_formatDate(_toDate)}';

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  Future<void> _startSync() async {
    if (_selectedIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one job source')),
      );
      return;
    }

    if (mounted) Navigator.of(context).pop();

    try {
      await AppSyncState.instance.runHistorySync(
        platformIds: _selectedIds,
        fromDate: _fromDate,
        toDate: _toDate,
      );
    } on SyncCancelledException {
      // User stopped sync from the scanning screen.
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sync failed. Try reconnecting Gmail.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.78,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          20 + MediaQuery.paddingOf(context).bottom,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHandle(),
            const SizedBox(height: 16),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (!widget.skipSourcesStep) ...[
                      Text(
                        'Select job sources',
                        style: AppTextStyles.darkGreeting.copyWith(fontSize: 20),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'We only scan emails related to the platforms you choose.',
                        style: AppTextStyles.darkSubtitle.copyWith(height: 1.4),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${_selectedIds.length} selected',
                        style: AppTextStyles.darkStatCaption.copyWith(
                          color: AppColors.secondary,
                        ),
                      ),
                      const SizedBox(height: 14),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 1.05,
                        ),
                        itemCount: JobPlatform.all.length,
                        itemBuilder: (context, index) {
                          final platform = JobPlatform.all[index];
                          return PlatformCard(
                            platform: platform,
                            isSelected: _selectedIds.contains(platform.id),
                            onTap: () {
                              setState(() {
                                if (_selectedIds.contains(platform.id)) {
                                  _selectedIds.remove(platform.id);
                                } else {
                                  _selectedIds.add(platform.id);
                                }
                              });
                            },
                          );
                        },
                      ),
                      const SizedBox(height: 16),
                    ] else ...[
                      Text(
                        'Ready to sync',
                        style: AppTextStyles.darkGreeting.copyWith(fontSize: 20),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'We\'ll scan your selected sources for job-related '
                        'emails from the last $mvpSyncRangeDays days.',
                        style: AppTextStyles.darkSubtitle.copyWith(height: 1.4),
                      ),
                      const SizedBox(height: 16),
                    ],
                    _buildMvpRangeCard(),
                    const SizedBox(height: 10),
                    _buildMvpNotice(),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _startSync,
              style: _primaryButtonStyle,
              child: const Text('Start Sync'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHandle() {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: AppColors.loginDivider,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildMvpRangeCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.secondary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.secondary.withValues(alpha: 0.25)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.schedule_outlined,
            size: 20,
            color: AppColors.secondary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Last $mvpSyncRangeDays days only (MVP)',
                  style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  _dateRangeLabel,
                  style: AppTextStyles.darkStatCaption,
                ),
                if (_selectedIds.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    '${_selectedIds.length} source${_selectedIds.length == 1 ? '' : 's'}: '
                    '${_selectedIds.map(platformLabel).join(', ')}',
                    style: AppTextStyles.darkStatCaption.copyWith(height: 1.35),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMvpNotice() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.onboardingIconLavender,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.platformsCardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.info_outline_rounded,
            size: 16,
            color: AppColors.dashboardMuted.withValues(alpha: 0.9),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Longer scan windows are disabled for now to keep sync fast and '
              'reduce AI usage. Use "Sync new emails" after your first sync '
              'for ongoing updates.',
              style: AppTextStyles.darkStatCaption.copyWith(height: 1.4),
            ),
          ),
        ],
      ),
    );
  }

  ButtonStyle get _primaryButtonStyle => FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(14),
        ),
      );
}
