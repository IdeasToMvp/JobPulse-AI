import 'package:flutter/material.dart';

import '../../../core/api/sync_cancelled_exception.dart';
import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../platforms/models/job_platform.dart';
import '../../platforms/widgets/platform_card.dart';

const _platformLabels = {
  'linkedin': 'LinkedIn',
  'naukri': 'Naukri',
  'indeed': 'Indeed',
  'instahyre': 'Instahyre',
  'wellfound': 'Wellfound',
  'foundit': 'Foundit',
  'glassdoor': 'Glassdoor',
  'career_pages': 'Career Pages',
  'referrals': 'Referrals',
};

enum _SyncStep { sources, dateRange }

enum _DatePreset { last30Days, last3Months, last1Year }

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
  late _SyncStep _step;
  late final Set<String> _selectedIds;
  _DatePreset _preset = _DatePreset.last30Days;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _step = widget.skipSourcesStep ? _SyncStep.dateRange : _SyncStep.sources;
    _selectedIds = widget.initialPlatformIds != null
        ? Set<String>.from(widget.initialPlatformIds!)
        : Set<String>.from(AppSyncState.instance.selectedPlatformIds);
  }

  DateTime get _toDate => DateTime.now();

  DateTime get _fromDate {
    switch (_preset) {
      case _DatePreset.last30Days:
        return _toDate.subtract(const Duration(days: 30));
      case _DatePreset.last3Months:
        return _toDate.subtract(const Duration(days: 90));
      case _DatePreset.last1Year:
        return _toDate.subtract(const Duration(days: 365));
    }
  }

  String get _dateRangeLabel =>
      '${_formatDate(_fromDate)} → ${_formatDate(_toDate)}';

  String _formatDate(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  void _goToDateRange() {
    if (_selectedIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one job source')),
      );
      return;
    }
    setState(() => _step = _SyncStep.dateRange);
  }

  Future<void> _startSync() async {
    setState(() => _isSaving = true);
    try {
      await UserApi.instance.markImportHistorySync();
      await AppSyncState.instance.saveJobSources(_selectedIds);
      if (mounted) Navigator.of(context).pop();
      // Start sync immediately so the dashboard shows the syncing state.
      await AppSyncState.instance.runSync(
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
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final stepIndex = _step == _SyncStep.sources ? 1 : 2;

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
            _buildStepIndicator(stepIndex),
            const SizedBox(height: 20),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _step == _SyncStep.sources
                    ? _buildSourcesStep(key: const ValueKey('sources'))
                    : _buildDateRangeStep(key: const ValueKey('dateRange')),
              ),
            ),
            const SizedBox(height: 16),
            _buildFooter(),
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

  Widget _buildStepIndicator(int step) {
    return Row(
      children: [
        _stepDot(active: step >= 1, label: '1'),
        Expanded(child: _stepLine(active: step >= 2)),
        _stepDot(active: step >= 2, label: '2'),
      ],
    );
  }

  Widget _stepDot({required bool active, required String label}) {
    return Container(
      width: 28,
      height: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: active ? AppColors.primary : AppColors.loginDivider,
        shape: BoxShape.circle,
      ),
      child: Text(
        label,
        style: AppTextStyles.continueButton.copyWith(
          fontSize: 12,
          color: active ? AppColors.white : AppColors.dashboardMuted,
        ),
      ),
    );
  }

  Widget _stepLine({required bool active}) {
    return Container(
      height: 2,
      margin: const EdgeInsets.symmetric(horizontal: 8),
      color: active ? AppColors.secondary : AppColors.loginDivider,
    );
  }

  Widget _buildSourcesStep({required Key key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
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
        ),
      ],
    );
  }

  Widget _buildDateRangeStep({required Key key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Choose scan range',
          style: AppTextStyles.darkGreeting.copyWith(fontSize: 20),
        ),
        const SizedBox(height: 6),
        Text(
          'How far back should we look for job-related emails?',
          style: AppTextStyles.darkSubtitle.copyWith(height: 1.4),
        ),
        const SizedBox(height: 24),
        _dateOption(
          title: 'Last 30 days',
          subtitle: 'Quick scan of recent activity',
          preset: _DatePreset.last30Days,
          icon: Icons.calendar_today_outlined,
        ),
        const SizedBox(height: 10),
        _dateOption(
          title: 'Last 3 months',
          subtitle: 'Good for an active job search',
          preset: _DatePreset.last3Months,
          icon: Icons.date_range_outlined,
        ),
        const SizedBox(height: 10),
        _dateOption(
          title: 'Last 1 year',
          subtitle: 'Maximum allowed scan window',
          preset: _DatePreset.last1Year,
          icon: Icons.history_rounded,
        ),
        const Spacer(),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.onboardingIconLavender,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.platformsCardBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Scanning period',
                style: AppTextStyles.darkStatCaption,
              ),
              const SizedBox(height: 4),
              Text(
                _dateRangeLabel,
                style: AppTextStyles.featureTitle.copyWith(fontSize: 15),
              ),
              const SizedBox(height: 6),
              Text(
                '${_selectedIds.length} source${_selectedIds.length == 1 ? '' : 's'}: '
                '${_selectedIds.map((id) => _platformLabels[id] ?? id).join(', ')}',
                style: AppTextStyles.darkStatCaption.copyWith(height: 1.35),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _dateOption({
    required String title,
    required String subtitle,
    required _DatePreset preset,
    required IconData icon,
  }) {
    final selected = _preset == preset;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => setState(() => _preset = preset),
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.secondary.withValues(alpha: 0.08)
                : AppColors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.secondary : AppColors.platformsCardBorder,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: selected
                      ? AppColors.secondary.withValues(alpha: 0.15)
                      : AppColors.onboardingIconLavender,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 20,
                  color: selected ? AppColors.secondary : AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTextStyles.featureTitle.copyWith(fontSize: 14)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AppTextStyles.darkStatCaption),
                  ],
                ),
              ),
              Icon(
                selected ? Icons.check_circle_rounded : Icons.circle_outlined,
                color: selected ? AppColors.secondary : AppColors.dashboardMuted,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter() {
    if (_step == _SyncStep.sources) {
      return FilledButton(
        onPressed: _goToDateRange,
        style: _primaryButtonStyle,
        child: const Text('Continue'),
      );
    }

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _isSaving ? null : () => setState(() => _step = _SyncStep.sources),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(48),
              side: const BorderSide(color: AppColors.platformsCardBorder),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text('Back'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: FilledButton(
            onPressed: _isSaving ? null : _startSync,
            style: _primaryButtonStyle,
            child: _isSaving
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppColors.white,
                    ),
                  )
                : const Text('Start Sync'),
          ),
        ),
      ],
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
