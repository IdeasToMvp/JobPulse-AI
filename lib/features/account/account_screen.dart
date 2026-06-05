import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import '../../core/auth/auth_state.dart';
import '../login/login_screen.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/widgets/glass_card.dart';
import '../../core/widgets/responsive_app_frame.dart';
import '../platforms/models/job_platform.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  static const _platformLabels = {
    'linkedin': 'LinkedIn',
    'naukri': 'Naukri',
    'indeed': 'Indeed',
    'instahyre': 'Instahyre',
    'wellfound': 'Wellfound',
    'foundit': 'Foundit',
    'glassdoor': 'Glassdoor',
    'career_pages': 'Company Careers',
    'referrals': 'Referrals',
  };

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        final state = AppSyncState.instance;
        return ColoredBox(
          color: AppColors.dashboardBackground,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Account', style: AppTextStyles.darkGreeting),
                const SizedBox(height: 20),
                _profileSection(state),
                const SizedBox(height: 16),
                _gmailSection(context, state),
                const SizedBox(height: 16),
                _syncSettingsSection(context, state),
                const SizedBox(height: 16),
                _jobSourcesSection(context, state),
                const SizedBox(height: 16),
                _privacySection(context, state),
                const SizedBox(height: 16),
                _signOutSection(context),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _profileSection(AppSyncState state) {
    return GlassCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 32,
            backgroundColor: AppColors.secondary.withValues(alpha: 0.3),
            child: Text(
              state.userName.isNotEmpty ? state.userName[0] : 'J',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w700,
                color: AppColors.white,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  state.userName,
                  style: AppTextStyles.featureTitle.copyWith(
                    color: AppColors.onboardingTitle,
                    fontSize: 18,
                  ),
                ),
                const SizedBox(height: 4),
                Text(state.userEmail, style: AppTextStyles.darkSubtitle),
                const SizedBox(height: 4),
                Text(
                  'Member since ${state.memberSince}',
                  style: AppTextStyles.darkStatCaption,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _gmailSection(BuildContext context, AppSyncState state) {
    return _section(
      title: 'Gmail Connection',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.loginSecurityBox,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'M',
                  style: TextStyle(
                    color: Color(0xFFEA4335),
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          state.isGmailSynced ? 'Connected' : 'Not connected',
                          style: AppTextStyles.featureTitle.copyWith(
                            color: AppColors.onboardingTitle,
                          ),
                        ),
                        if (state.isGmailSynced) ...[
                          const SizedBox(width: 6),
                          const Icon(
                            Icons.check_circle_rounded,
                            color: AppColors.success,
                            size: 16,
                          ),
                        ],
                      ],
                    ),
                    Text(state.userEmail, style: AppTextStyles.darkStatCaption),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _syncSettingsSection(BuildContext context, AppSyncState state) {
    return _section(
      title: 'Sync Settings',
      child: Column(
        children: [
          _toggleRow(
            title: 'Auto Sync',
            subtitle: 'Automatically scan Gmail for new job updates.',
            value: state.autoSyncEnabled,
            onChanged: (value) => _persistAutoSync(context, state, value),
          ),
          const Divider(color: AppColors.platformsCardBorder, height: 24),
          _dropdownRow(
            context,
            label: 'Sync Frequency',
            value: state.syncFrequency.label,
            items: SyncFrequency.values.map((f) => f.label).toList(),
            onChanged: (label) {
              final match = SyncFrequency.values.firstWhere(
                (f) => f.label == label,
              );
              _persistSyncFrequency(context, state, match);
            },
          ),
          const SizedBox(height: 14),
          _infoRow('Last Sync', state.lastSyncLabel),
          const SizedBox(height: 8),
          _infoRow('Next Scheduled Sync', state.nextScheduledSyncLabel),
        ],
      ),
    );
  }

  Widget _jobSourcesSection(BuildContext context, AppSyncState state) {
    final labels = state.selectedPlatformIds
        .map((id) => _platformLabels[id] ?? id)
        .toList();

    return _section(
      title: 'Job Sources',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (labels.isEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(
                'No job sources selected yet.',
                style: AppTextStyles.darkStatCaption,
              ),
            ),
          ...labels.map(
            (label) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(
                    Icons.check_rounded,
                    color: AppColors.success,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: AppTextStyles.featureTitle.copyWith(
                      color: AppColors.onboardingTitle,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          _outlineAction(
            context,
            'Edit Sources',
            () => _editSources(context, state),
          ),
        ],
      ),
    );
  }

  Widget _privacySection(BuildContext context, AppSyncState state) {
    return _section(
      title: 'Privacy',
      child: _outlineAction(
        context,
        'Delete All Data',
        () => _confirmDeleteData(context, state),
        destructive: true,
      ),
    );
  }

  Widget _signOutSection(BuildContext context) {
    return _section(
      title: 'Session',
      child: _outlineAction(
        context,
        'Sign Out',
        () => _confirmSignOut(context),
        destructive: true,
      ),
    );
  }

  Widget _section({required String title, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            title,
            style: AppTextStyles.darkCardTag.copyWith(
              color: AppColors.dashboardMuted,
              fontSize: 11,
              letterSpacing: 1,
            ),
          ),
        ),
        GlassCard(child: child),
      ],
    );
  }

  Widget _toggleRow({
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(
        title,
        style: AppTextStyles.featureTitle.copyWith(
          color: AppColors.onboardingTitle,
          fontSize: 14,
        ),
      ),
      subtitle: subtitle != null
          ? Text(subtitle, style: AppTextStyles.darkStatCaption)
          : null,
      value: value,
      activeThumbColor: AppColors.secondary,
      activeTrackColor: AppColors.secondary.withValues(alpha: 0.35),
      onChanged: onChanged,
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.darkStatCaption),
        Text(
          value,
          style: AppTextStyles.featureTitle.copyWith(
            color: AppColors.onboardingTitle,
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _dropdownRow(
    BuildContext context, {
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTextStyles.darkStatCaption),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          initialValue: value,
          dropdownColor: AppColors.white,
          style: const TextStyle(color: AppColors.onboardingTitle),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.loginSecurityBox,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.platformsCardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.platformsCardBorder),
            ),
          ),
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _outlineAction(
    BuildContext context,
    String label,
    VoidCallback onTap, {
    bool destructive = false,
  }) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: destructive ? AppColors.error : AppColors.secondary,
          side: BorderSide(
            color: destructive
                ? AppColors.error.withValues(alpha: 0.5)
                : AppColors.secondary.withValues(alpha: 0.4),
          ),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        child: Text(label),
      ),
    );
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.white,
        title: const Text('Sign out?'),
        content: const Text(
          'You will need to sign in with Google again to access your dashboard.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    await AuthState.instance.signOut();
    if (!context.mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<void> _confirmDeleteData(BuildContext context, AppSyncState state) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.white,
        title: const Text('Delete all synced data?'),
        content: const Text(
          'This permanently removes everything JobPulse AI has synced from '
          'your Gmail:\n\n'
          '• Processed emails\n'
          '• Job applications and their statuses\n'
          '• Dashboard stats and platform breakdowns\n\n'
          'Your Google sign-in and job source preferences are kept. '
          'This action cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete all data', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.white,
        title: const Text('Are you sure?'),
        content: const Text(
          'All synced job tracking data will be erased from your account.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep data')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Yes, delete everything', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await state.deleteAllData();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All synced data has been cleared')),
      );
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to clear data')),
      );
    }
  }

  Future<void> _editSources(BuildContext context, AppSyncState state) async {
    final selected = Set<String>.from(state.selectedPlatformIds);
    await showAppBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.72,
          minChildSize: 0.45,
          maxChildSize: 0.92,
          builder: (context, scrollController) {
            return StatefulBuilder(
              builder: (ctx, setModalState) {
                return Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
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
                      Text(
                        'Edit Job Sources',
                        style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: ListView(
                          controller: scrollController,
                          children: [
                            for (final platform in JobPlatform.all)
                              CheckboxListTile(
                                contentPadding: EdgeInsets.zero,
                                value: selected.contains(platform.id),
                                activeColor: AppColors.secondary,
                                title: Text(
                                  _platformLabels[platform.id] ?? platform.label,
                                  style: const TextStyle(
                                    color: AppColors.onboardingTitle,
                                  ),
                                ),
                                onChanged: (v) {
                                  setModalState(() {
                                    if (v == true) {
                                      selected.add(platform.id);
                                    } else {
                                      selected.remove(platform.id);
                                    }
                                  });
                                },
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: selected.isEmpty
                            ? null
                            : () async {
                                try {
                                  await state.saveJobSources(selected);
                                  if (ctx.mounted) Navigator.pop(ctx);
                                } catch (_) {
                                  if (!ctx.mounted) return;
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    const SnackBar(
                                      content: Text('Failed to save job sources'),
                                    ),
                                  );
                                }
                              },
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          minimumSize: const Size.fromHeight(48),
                        ),
                        child: const Text('Save'),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  Future<void> _persistAutoSync(
    BuildContext context,
    AppSyncState state,
    bool value,
  ) async {
    try {
      await state.persistAutoSync(value);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save sync settings')),
      );
    }
  }

  Future<void> _persistSyncFrequency(
    BuildContext context,
    AppSyncState state,
    SyncFrequency value,
  ) async {
    try {
      await state.persistSyncFrequency(value);
    } catch (_) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save sync settings')),
      );
    }
  }
}
