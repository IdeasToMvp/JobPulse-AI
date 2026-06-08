import 'package:flutter/material.dart';

import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'add_application_sheet.dart';
import 'application_detail_sheet.dart';
import 'application_list_card.dart';
import 'update_status_sheet.dart';

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
  int _lastAppliedCount = 0;
  String _statusFilter = 'applied';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _lastSyncAt = AppSyncState.instance.sync.lastSyncedAt;
    _lastFeedRevision = AppSyncState.instance.feedRevision;
    _lastAppliedCount = AppSyncState.instance.sync.appliedCount;
    _statusFilter =
        AppSyncState.instance.consumePendingApplicationsStatusFilter() ??
            _statusFilter;
    AppSyncState.instance.addListener(_onSyncStateChanged);
    _load();
  }

  @override
  void dispose() {
    AppSyncState.instance.removeListener(_onSyncStateChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSyncStateChanged() {
    final pendingStatus =
        AppSyncState.instance.consumePendingApplicationsStatusFilter();
    if (pendingStatus != null && pendingStatus != _statusFilter) {
      setState(() => _statusFilter = pendingStatus);
    }

    final syncAt = AppSyncState.instance.sync.lastSyncedAt;
    final feedRevision = AppSyncState.instance.feedRevision;
    final appliedCount = AppSyncState.instance.sync.appliedCount;
    if ((syncAt != null && syncAt != _lastSyncAt) ||
        feedRevision != _lastFeedRevision ||
        appliedCount != _lastAppliedCount) {
      _lastSyncAt = syncAt;
      _lastFeedRevision = feedRevision;
      _lastAppliedCount = appliedCount;
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

  void _onApplicationCreated(ApplicationDetail detail) {
    setState(() {
      _applications = [detail, ..._applications];
    });
  }

  void _openAddApplication() {
    AddApplicationSheet.show(
      context,
      onCreated: _onApplicationCreated,
    );
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

    var result = _statusFilter == 'applied'
        ? sorted
        : sorted.where((a) => a.status == _statusFilter).toList();

    final q = _searchQuery.trim().toLowerCase();
    if (q.isNotEmpty) {
      result = result
          .where(
            (a) =>
                a.company.toLowerCase().contains(q) ||
                (a.role?.toLowerCase().contains(q) ?? false),
          )
          .toList();
    }

    return result;
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

  Widget _buildSearchBar() {
    return TextField(
      controller: _searchController,
      onChanged: (v) => setState(() => _searchQuery = v),
      decoration: InputDecoration(
        hintText: 'Search by company or role…',
        hintStyle: AppTextStyles.darkStatCaption,
        prefixIcon: const Icon(
          Icons.search_rounded,
          size: 20,
          color: AppColors.dashboardMuted,
        ),
        suffixIcon: _searchQuery.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.close_rounded, size: 18),
                color: AppColors.dashboardMuted,
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
              )
            : null,
        filled: true,
        fillColor: AppColors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 0),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.platformsCardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.platformsCardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
      ),
    );
  }

  Future<void> _load() async {
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
          final countsAheadOfList =
              AppSyncState.instance.sync.appliedCount > 0;
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
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Applications',
                                  style: AppTextStyles.darkGreeting.copyWith(
                                    fontSize: 22,
                                  ),
                                ),
                              ),
                              FilledButton.icon(
                                onPressed: _openAddApplication,
                                icon: const Icon(Icons.add_rounded, size: 18),
                                label: const Text('Add'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: AppColors.white,
                                  visualDensity: VisualDensity.compact,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                for (var i = 0;
                                    i < _statusFilters.length;
                                    i++) ...[
                                  if (i > 0) const SizedBox(width: 8),
                                  _FilterChip(
                                    label: _filterLabel(_statusFilters[i]),
                                    selected: _statusFilter ==
                                        _statusFilters[i].id,
                                    onTap: () => setState(
                                      () => _statusFilter =
                                          _statusFilters[i].id,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 10),
                          _buildSearchBar(),
                        ],
                      ),
                    ),
                  ),
                  SliverFillRemaining(
                    hasScrollBody: false,
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
                              countsAheadOfList
                                  ? 'Sync was stopped before the list finished loading. Pull down to refresh applications found so far.'
                                  : 'No applications yet. Add one manually or connect Gmail to sync from email.',
                              textAlign: TextAlign.center,
                              style: AppTextStyles.darkSubtitle,
                            ),
                            if (!countsAheadOfList) ...[
                              const SizedBox(height: 20),
                              FilledButton.icon(
                                onPressed: _openAddApplication,
                                icon: const Icon(Icons.add_rounded, size: 18),
                                label: const Text('Add application'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: AppColors.white,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
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
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Applications',
                                style: AppTextStyles.darkGreeting.copyWith(
                                  fontSize: 22,
                                ),
                              ),
                            ),
                            FilledButton.icon(
                              onPressed: _openAddApplication,
                              icon: const Icon(Icons.add_rounded, size: 18),
                              label: const Text('Add'),
                              style: FilledButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: AppColors.white,
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                          ],
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
                        const SizedBox(height: 10),
                        _buildSearchBar(),
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
                          _searchQuery.trim().isNotEmpty
                              ? 'No results for "$_searchQuery".'
                              : 'No applications with status '
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
                        return ApplicationListCard(
                          application: app,
                          onTap: () =>
                              ApplicationDetailSheet.show(context, app),
                          onStatusTap: () => _openStatusUpdate(app),
                          displaySalary: displaySalary,
                          displayLocation: displayLocation,
                          formatDate: _formatDate,
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
