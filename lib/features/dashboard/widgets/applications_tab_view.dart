import 'package:flutter/material.dart';

import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/glass_card.dart';
import 'application_detail_sheet.dart';
import 'application_status_badge.dart';
import 'update_status_sheet.dart';

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
  'company_direct': 'Company email',
};

const _statusFilters = [
  _StatusFilter(id: 'applied', label: 'Applied'),
  _StatusFilter(id: 'active', label: 'Active'),
  _StatusFilter(id: 'interview', label: 'Interview'),
  _StatusFilter(id: 'offer', label: 'Offer'),
  _StatusFilter(id: 'rejected', label: 'Rejected'),
  _StatusFilter(id: 'ghosted', label: 'Ghosted'),
];

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
  int _lastFeedRevision = 0;
  String _statusFilter = 'applied';

  @override
  void initState() {
    super.initState();
    _lastSyncAt = AppSyncState.instance.sync.lastSyncedAt;
    _lastFeedRevision = AppSyncState.instance.feedRevision;
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
    final feedRevision = AppSyncState.instance.feedRevision;
    if ((syncAt != null && syncAt != _lastSyncAt) ||
        feedRevision != _lastFeedRevision) {
      _lastSyncAt = syncAt;
      _lastFeedRevision = feedRevision;
      _load();
    }
  }

  void _onApplicationUpdated(ApplicationDetail detail) {
    setState(() {
      final index = _applications.indexWhere((a) => a.id == detail.id);
      if (index >= 0) {
        _applications[index] = detail;
      }
    });
  }

  void _openStatusUpdate(JobApplication app) {
    UpdateStatusSheet.show(
      context,
      application: app,
      onUpdated: _onApplicationUpdated,
    );
  }

  List<JobApplication> get _filteredApplications {
    final sorted = [..._applications]
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));

    if (_statusFilter == 'applied') return sorted;
    return sorted.where((a) => a.status == _statusFilter).toList();
  }

  int _countForStatus(String statusId) {
    final sync = AppSyncState.instance.sync;
    switch (statusId) {
      case 'applied':
        return sync.appliedCount;
      case 'active':
        return sync.activeCount;
      case 'interview':
        return sync.interviewsCount;
      case 'offer':
        return sync.offersCount;
      case 'rejected':
        return sync.rejectedCount;
      case 'ghosted':
        return sync.ghostedCount;
      default:
        return 0;
    }
  }

  String _filterLabel(_StatusFilter filter) {
    final count = _countForStatus(filter.id);
    return '${filter.label} ($count)';
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
        _applications = apps
          ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
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

        final filtered = _filteredApplications;

        return ColoredBox(
          color: AppColors.dashboardBackground,
          child: RefreshIndicator(
            onRefresh: _load,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Applications',
                          style: AppTextStyles.darkGreeting.copyWith(
                            fontSize: 22,
                          ),
                        ),
                        const SizedBox(height: 12),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              for (var i = 0; i < _statusFilters.length; i++) ...[
                                if (i > 0) const SizedBox(width: 8),
                                _FilterChip(
                                  label: _filterLabel(_statusFilters[i]),
                                  selected:
                                      _statusFilter == _statusFilters[i].id,
                                  onTap: () => setState(
                                    () => _statusFilter = _statusFilters[i].id,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                if (filtered.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text(
                          'No applications with status '
                          '"${_statusFilters.firstWhere((f) => f.id == _statusFilter).label}".',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.darkSubtitle,
                        ),
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                    sliver: SliverList.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final app = filtered[index];
                        return GlassCard(
                          padding: const EdgeInsets.all(14),
                          onTap: () => ApplicationDetailSheet.show(context, app),
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
                                    if ((app.companyApplyCount ?? 0) > 1) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        '${app.companyApplyCount} applications'
                                        '${app.companyRoles != null && app.companyRoles!.isNotEmpty ? ' · ${app.companyRoles!.join(', ')}' : ''}',
                                        style: AppTextStyles.darkStatCaption
                                            .copyWith(
                                          color: AppColors.secondary,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                    if (app.role != null) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        app.role!,
                                        style: AppTextStyles.darkSubtitle,
                                      ),
                                    ],
                                    const SizedBox(height: 6),
                                    if (app.extractedDetails?.salary != null ||
                                        app.extractedDetails?.location !=
                                            null) ...[
                                      Wrap(
                                        spacing: 6,
                                        runSpacing: 4,
                                        children: [
                                          if (app.extractedDetails?.salary !=
                                              null)
                                            _infoChip(
                                              app.extractedDetails!.salary!,
                                            ),
                                          if (app.extractedDetails?.location !=
                                              null)
                                            _infoChip(
                                              app.extractedDetails!.location!,
                                            ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                    ],
                                    Text(
                                      _platformLabels[app.platformId] ??
                                          app.platformId,
                                      style: AppTextStyles.darkStatCaption,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      'Applied ${_formatDate(app.appliedAt)}',
                                      style: AppTextStyles.darkStatCaption,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Updated ${_formatDate(app.updatedAt)}',
                                      style: AppTextStyles.darkStatCaption
                                          .copyWith(
                                        color: AppColors.secondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ApplicationStatusBadge(
                                status: app.status,
                                onTap: () => _openStatusUpdate(app),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    final local = date.toLocal();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[local.month - 1]} ${local.day}, ${local.year}';
  }

  Widget _infoChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.secondary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: AppTextStyles.darkStatCaption.copyWith(fontSize: 10),
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

class _StatusFilter {
  const _StatusFilter({required this.id, required this.label});
  final String id;
  final String label;
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.secondary.withValues(alpha: 0.15)
                : AppColors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: selected
                  ? AppColors.secondary.withValues(alpha: 0.5)
                  : AppColors.platformsCardBorder,
            ),
          ),
          child: Text(
            label,
            style: AppTextStyles.featureTitle.copyWith(
              fontSize: 13,
              color: selected
                  ? AppColors.secondary
                  : AppColors.dashboardMuted,
            ),
          ),
        ),
      ),
    );
  }
}
