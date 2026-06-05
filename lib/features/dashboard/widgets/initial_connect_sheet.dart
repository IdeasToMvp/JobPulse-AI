import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/responsive_app_frame.dart';
import '../../platforms/models/job_platform.dart';
import '../../platforms/widgets/platform_card.dart';
import 'sync_prepare_sheet.dart';

enum _ConnectStep { mode, sources }

enum _ConnectMode { trackNew, importHistory }

class InitialConnectSheet extends StatefulWidget {
  const InitialConnectSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showAppBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => const InitialConnectSheet(),
    );
  }

  @override
  State<InitialConnectSheet> createState() => _InitialConnectSheetState();
}

class _InitialConnectSheetState extends State<InitialConnectSheet> {
  _ConnectStep _step = _ConnectStep.mode;
  _ConnectMode? _mode;
  final Set<String> _selectedIds = {};
  bool _isSaving = false;

  Future<void> _continueFromSources() async {
    if (_selectedIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select at least one job source')),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      if (_mode == _ConnectMode.trackNew) {
        await AppSyncState.instance.setupNewOnlyTracking(_selectedIds);
        if (mounted) Navigator.of(context).pop();
      } else {
        if (!mounted) return;
        final ids = Set<String>.from(_selectedIds);
        Navigator.of(context).pop();
        await SyncPrepareSheet.show(
          context,
          initialPlatformIds: ids,
          skipSourcesStep: true,
          onSyncStarted: () {},
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Setup failed. Try again.')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
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
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _step == _ConnectStep.mode
                    ? _buildModeStep(key: const ValueKey('mode'))
                    : _buildSourcesStep(key: const ValueKey('sources')),
              ),
            ),
            const SizedBox(height: 16),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildModeStep({required Key key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'How should we start?',
          style: AppTextStyles.darkGreeting.copyWith(fontSize: 20),
        ),
        const SizedBox(height: 6),
        Text(
          'Choose whether to import past applications or only track new emails going forward.',
          style: AppTextStyles.darkSubtitle.copyWith(height: 1.4),
        ),
        const SizedBox(height: 24),
        _modeOption(
          title: 'Track New Emails Only',
          subtitle:
              'Start from today. Future job emails will sync automatically on your schedule.',
          icon: Icons.mark_email_unread_outlined,
          mode: _ConnectMode.trackNew,
        ),
        const SizedBox(height: 10),
        _modeOption(
          title: 'Import Existing Job History',
          subtitle:
              'Scan past emails from LinkedIn, Indeed, and your other sources.',
          icon: Icons.history_rounded,
          mode: _ConnectMode.importHistory,
        ),
      ],
    );
  }

  Widget _modeOption({
    required String title,
    required String subtitle,
    required IconData icon,
    required _ConnectMode mode,
  }) {
    final selected = _mode == mode;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => setState(() => _mode = mode),
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
            crossAxisAlignment: CrossAxisAlignment.start,
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
                    Text(
                      title,
                      style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: AppTextStyles.darkStatCaption.copyWith(height: 1.35),
                    ),
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
          _mode == _ConnectMode.trackNew
              ? 'We will watch these platforms for new job-related emails.'
              : 'We only scan emails related to the platforms you choose.',
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

  Widget _buildFooter() {
    if (_step == _ConnectStep.mode) {
      return FilledButton(
        onPressed: _mode == null
            ? null
            : () => setState(() => _step = _ConnectStep.sources),
        style: _primaryButtonStyle,
        child: const Text('Continue'),
      );
    }

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: _isSaving
                ? null
                : () => setState(() => _step = _ConnectStep.mode),
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
            onPressed: _isSaving ? null : _continueFromSources,
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
                : Text(
                    _mode == _ConnectMode.trackNew
                        ? 'Start Tracking'
                        : 'Choose Scan Range',
                  ),
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
