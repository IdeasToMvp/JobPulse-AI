import 'package:flutter/material.dart';

import '../../../core/api/user_api.dart';
import '../../../core/app_sync_state.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/activity.dart';
import '../../../core/models/application.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/relative_time.dart';
import 'application_detail_sheet.dart';

class ActivityTabView extends StatefulWidget {
  const ActivityTabView({super.key});

  @override
  State<ActivityTabView> createState() => _ActivityTabViewState();
}

class _ActivityTabViewState extends State<ActivityTabView> {
  static const _pageSize = 20;

  final List<ActivityItem> _items = [];
  final Map<String, JobApplication> _applicationsById = {};

  ActivityFilter _filter = ActivityFilter.all;
  bool _initialLoading = true;
  bool _filterLoading = false;
  bool _loadingMore = false;
  bool _hasMore = false;
  int _offset = 0;
  String? _error;
  DateTime? _lastSyncAt;
  int _lastFeedRevision = 0;

  @override
  void initState() {
    super.initState();
    _lastSyncAt = AppSyncState.instance.sync.lastSyncedAt;
    _lastFeedRevision = AppSyncState.instance.feedRevision;
    AppSyncState.instance.addListener(_onSyncStateChanged);
    _load(refresh: true, initial: true);
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
      _load(refresh: true);
    }
  }

  Future<void> _load({bool refresh = false, bool initial = false}) async {
    if (!AppSyncState.instance.hasSyncedData) {
      setState(() {
        _initialLoading = false;
        _filterLoading = false;
        _items.clear();
      });
      return;
    }

    if (refresh) {
      setState(() {
        if (initial || _items.isEmpty) {
          _initialLoading = true;
        } else {
          _filterLoading = true;
        }
        _error = null;
        _offset = 0;
        _hasMore = false;
      });
    } else {
      if (_loadingMore || !_hasMore || _filterLoading) return;
      setState(() => _loadingMore = true);
    }

    try {
      final page = await UserApi.instance.fetchActivities(
        filter: _filter,
        offset: refresh ? 0 : _offset,
        limit: _pageSize,
      );

      if (refresh) {
        await _loadApplications();
      }

      if (!mounted) return;
      setState(() {
        if (refresh) {
          _items
            ..clear()
            ..addAll(page.items);
        } else {
          _items.addAll(page.items);
        }
        _offset = _items.length;
        _hasMore = page.hasMore;
        _initialLoading = false;
        _filterLoading = false;
        _loadingMore = false;
      });
    } on AuthException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _initialLoading = false;
        _filterLoading = false;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load activity';
        _initialLoading = false;
        _filterLoading = false;
        _loadingMore = false;
      });
    }
  }

  Future<void> _loadApplications() async {
    try {
      final apps = await UserApi.instance.fetchApplications();
      _applicationsById
        ..clear()
        ..addEntries(apps.map((a) => MapEntry(a.id, a)));
    } catch (_) {}
  }

  void _onFilterChanged(ActivityFilter filter) {
    if (_filter == filter || _filterLoading) return;
    setState(() => _filter = filter);
    _load(refresh: true);
  }

  void _onActivityTap(ActivityItem item) {
    final appId = item.applicationId;
    if (appId == null) return;
    final application = _applicationsById[appId];
    if (application == null) return;
    ApplicationDetailSheet.show(context, application);
  }

  String get _emptyMessage {
    if (_error != null) return _error!;
    if (_filter == ActivityFilter.all) {
      return 'No activity yet. Sync Gmail to start building your timeline.';
    }
    return 'No ${_filter.label.toLowerCase()} yet.';
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppSyncState.instance,
      builder: (context, child) {
        if (!AppSyncState.instance.hasSyncedData) {
          return _DisconnectedEmptyState(
            message:
                'No activity yet. Connect Gmail and start tracking applications.',
          );
        }

        final groups = _groupItems(_items);

        return ColoredBox(
          color: AppColors.dashboardBackground,
          child: RefreshIndicator(
            onRefresh: () => _load(refresh: true),
            child: NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                if (notification is ScrollEndNotification &&
                    notification.metrics.extentAfter < 200) {
                  _load();
                }
                return false;
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _buildHeader()),
                  if (_initialLoading)
                    const SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (_filterLoading)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.symmetric(vertical: 32),
                        child: Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      ),
                    )
                  else if (_error != null || _items.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: _InlineEmptyMessage(message: _emptyMessage),
                    )
                  else ...[
                    for (final group in groups) ...[
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                          child: Text(
                            group.label,
                            style: AppTextStyles.darkCardTag.copyWith(
                              color: AppColors.dashboardMuted,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ),
                      SliverPadding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) {
                              final item = group.items[index];
                              final isLast = index == group.items.length - 1;
                              return _ActivityTimelineTile(
                                item: item,
                                isLast: isLast,
                                onTap: item.applicationId != null
                                    ? () => _onActivityTap(item)
                                    : null,
                              );
                            },
                            childCount: group.items.length,
                          ),
                        ),
                      ),
                    ],
                    if (_loadingMore)
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        ),
                      )
                    else
                      const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Activity',
            style: AppTextStyles.darkGreeting.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 6),
          Text(
            'Your job search timeline',
            style: AppTextStyles.darkSubtitle,
          ),
          const SizedBox(height: 14),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < ActivityFilter.values.length; i++) ...[
                  if (i > 0) const SizedBox(width: 8),
                  _FilterChip(
                    label: ActivityFilter.values[i].label,
                    selected: _filter == ActivityFilter.values[i],
                    enabled: !_filterLoading,
                    onTap: () => _onFilterChanged(ActivityFilter.values[i]),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  List<_ActivityGroup> _groupItems(List<ActivityItem> items) {
    final map = <String, List<ActivityItem>>{};
    for (final item in items) {
      final label = activityDateGroupLabel(item.timestamp);
      map.putIfAbsent(label, () => []).add(item);
    }

    const order = ['Today', 'Yesterday', 'Older'];
    return order
        .where((label) => map.containsKey(label))
        .map((label) => _ActivityGroup(label: label, items: map[label]!))
        .toList();
  }
}

class _DisconnectedEmptyState extends StatelessWidget {
  const _DisconnectedEmptyState({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.dashboardBackground,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.timeline_rounded,
                size: 48,
                color: AppColors.secondary.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 16),
              Text(
                'Activity',
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

class _InlineEmptyMessage extends StatelessWidget {
  const _InlineEmptyMessage({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.timeline_rounded,
              size: 40,
              color: AppColors.secondary.withValues(alpha: 0.45),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTextStyles.darkSubtitle,
            ),
          ],
        ),
      ),
    );
  }
}

class _ActivityGroup {
  const _ActivityGroup({required this.label, required this.items});
  final String label;
  final List<ActivityItem> items;
}

class _ActivityTimelineTile extends StatelessWidget {
  const _ActivityTimelineTile({
    required this.item,
    required this.isLast,
    this.onTap,
  });

  final ActivityItem item;
  final bool isLast;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final icon = _iconForType(item.type);
    final iconColor = _colorForType(item.type);
    final displayName = item.company ?? item.title;
    final lines = item.description.split('\n');
    final subtitle = lines.first;
    final detail = lines.length > 1 ? lines.sublist(1).join('\n') : null;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: iconColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: iconColor.withValues(alpha: 0.35),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: AppColors.platformsCardBorder,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(14),
                  child: Ink(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.platformsCardBorder),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (item.type != ActivityType.sync)
                          _CompanyAvatar(name: displayName)
                        else
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.onboardingIconLavender,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(icon, color: iconColor, size: 20),
                          ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.title,
                                      style: AppTextStyles.featureTitle
                                          .copyWith(fontSize: 14),
                                    ),
                                  ),
                                  Text(
                                    formatRelativeTimestamp(item.timestamp),
                                    style: AppTextStyles.darkStatCaption
                                        .copyWith(fontSize: 11),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                subtitle,
                                style: AppTextStyles.darkSubtitle.copyWith(
                                  fontSize: 13,
                                  height: 1.35,
                                ),
                              ),
                              if (detail != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  detail,
                                  style: AppTextStyles.darkStatCaption,
                                ),
                              ],
                              if (onTap != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'View application',
                                  style: AppTextStyles.darkStatCaption.copyWith(
                                    color: AppColors.secondary,
                                    fontWeight: FontWeight.w600,
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
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(ActivityType type) {
    switch (type) {
      case ActivityType.application:
        return Icons.work_outline_rounded;
      case ActivityType.statusUpdate:
        return Icons.swap_horiz_rounded;
      case ActivityType.suggestion:
        return Icons.auto_awesome_rounded;
      case ActivityType.sync:
        return Icons.sync_rounded;
      case ActivityType.userAction:
        return Icons.person_outline_rounded;
    }
  }

  Color _colorForType(ActivityType type) {
    switch (type) {
      case ActivityType.application:
        return AppColors.secondary;
      case ActivityType.statusUpdate:
        return AppColors.warning;
      case ActivityType.suggestion:
        return const Color(0xFF8B5CF6);
      case ActivityType.sync:
        return AppColors.primary;
      case ActivityType.userAction:
        return AppColors.dashboardMuted;
    }
  }
}

class _CompanyAvatar extends StatelessWidget {
  const _CompanyAvatar({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final hue = name.hashCode.abs() % 360;

    return CircleAvatar(
      radius: 20,
      backgroundColor:
          HSLColor.fromAHSL(1, hue.toDouble(), 0.45, 0.55).toColor(),
      child: Text(
        initial,
        style: const TextStyle(
          color: AppColors.white,
          fontWeight: FontWeight.w700,
          fontSize: 15,
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.enabled = true,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: enabled ? onTap : null,
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
