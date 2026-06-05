import 'package:flutter/material.dart';

import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/glass_card.dart';

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

class ApplicationsTabView extends StatefulWidget {
  const ApplicationsTabView({super.key});

  @override
  State<ApplicationsTabView> createState() => _ApplicationsTabViewState();
}

class _ApplicationsTabViewState extends State<ApplicationsTabView> {
  List<JobApplication> _applications = [];
  bool _loading = true;
  String? _error;
  DateTime? _lastSyncAt;

  @override
  void initState() {
    super.initState();
    _lastSyncAt = AppSyncState.instance.sync.lastSyncedAt;
    AppSyncState.instance.addListener(_onSyncStateChanged);
    _load();
  }

  @override
  void dispose() {
    AppSyncState.instance.removeListener(_onSyncStateChanged);
    super.dispose();
  }

  void _onSyncStateChanged() {
    final syncAt = AppSyncState.instance.sync.lastSyncedAt;
    if (syncAt != null && syncAt != _lastSyncAt) {
      _lastSyncAt = syncAt;
      _load();
    }
  }

  Future<void> _load() async {
    if (!AppSyncState.instance.hasSyncedData) {
      setState(() {
        _loading = false;
        _applications = [];
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apps = await UserApi.instance.fetchApplications();
      if (!mounted) return;
      setState(() {
        _applications = apps;
        _loading = false;
      });
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load applications';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        if (!AppSyncState.instance.hasSyncedData) {
          return _emptyState(
            'Sync Gmail to start tracking your job applications.',
          );
        }

        if (_loading) {
          return const ColoredBox(
            color: AppColors.dashboardBackground,
            child: Center(child: CircularProgressIndicator()),
          );
        }

        if (_error != null) {
          return _emptyState(_error!);
        }

        if (_applications.isEmpty) {
          return _emptyState('No applications found for your selected sources.');
        }

        return ColoredBox(
          color: AppColors.dashboardBackground,
          child: RefreshIndicator(
            onRefresh: _load,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              itemCount: _applications.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final app = _applications[index];
                return GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              app.company,
                              style: AppTextStyles.featureTitle,
                            ),
                            if (app.role != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                app.role!,
                                style: AppTextStyles.darkSubtitle,
                              ),
                            ],
                            const SizedBox(height: 6),
                            Text(
                              _platformLabels[app.platformId] ?? app.platformId,
                              style: AppTextStyles.darkStatCaption,
                            ),
                          ],
                        ),
                      ),
                      _statusBadge(app.status),
                    ],
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }

  Widget _statusBadge(String status) {
    Color color;
    switch (status) {
      case 'interview':
        color = AppColors.warning;
      case 'offer':
        color = AppColors.success;
      case 'rejected':
      case 'ghosted':
        color = AppColors.error;
      default:
        color = AppColors.secondary;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: AppTextStyles.darkCardTag.copyWith(
          color: color,
          fontSize: 10,
        ),
      ),
    );
  }

  Widget _emptyState(String message) {
    return ColoredBox(
      color: AppColors.dashboardBackground,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.work_outline_rounded,
                size: 48,
                color: AppColors.secondary.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 16),
              Text(
                'Applications',
                style: AppTextStyles.darkGreeting.copyWith(fontSize: 22),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: AppTextStyles.darkSubtitle,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
