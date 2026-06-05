import 'package:flutter/material.dart';

import '../../../core/api/user_api.dart';
import '../../../core/auth/auth_service.dart';
import '../../../core/models/application.dart';
import '../../../core/models/application_status.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/salary_format.dart';
import '../../../core/widgets/responsive_app_frame.dart';
import 'active_details_sheet.dart';
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

class ApplicationDetailSheet extends StatefulWidget {
  const ApplicationDetailSheet({
    super.key,
    required this.application,
    this.showStatusHistory = false,
  });

  final JobApplication application;
  final bool showStatusHistory;

  static Future<void> show(
    BuildContext context,
    JobApplication application, {
    bool showStatusHistory = false,
  }) {
    return showAppBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ApplicationDetailSheet(
        application: application,
        showStatusHistory: showStatusHistory,
      ),
    );
  }

  @override
  State<ApplicationDetailSheet> createState() => _ApplicationDetailSheetState();
}

class _ApplicationDetailSheetState extends State<ApplicationDetailSheet> {
  ApplicationDetail? _detail;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.showStatusHistory) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final detail =
          await UserApi.instance.fetchApplication(widget.application.id);
      if (!mounted) return;
      setState(() {
        _detail = detail;
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
        _error = 'Failed to load application details';
        _loading = false;
      });
    }
  }

  JobApplication get _application => _detail ?? widget.application;

  void _openStatusUpdate() {
    UpdateStatusSheet.show(
      context,
      application: _application,
      onUpdated: (detail) {
        setState(() => _detail = detail);
      },
    );
  }

  void _openDetailsEdit() {
    ActiveDetailsSheet.show(
      context,
      application: _application,
      mode: ActiveDetailsMode.editOnly,
      onUpdated: (detail) {
        setState(() => _detail = detail);
      },
    );
  }

  bool get _canEditDetails =>
      _application.status == 'active' ||
      (_application.userDetails?.hasAny ?? false);

  @override
  Widget build(BuildContext context) {
    final maxHeight = MediaQuery.sizeOf(context).height * 0.85;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.paddingOf(context).bottom,
      ),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxHeight),
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
            Row(
              children: [
                _CompanyAvatar(name: _application.company, size: 48),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _application.company,
                        style:
                            AppTextStyles.darkGreeting.copyWith(fontSize: 18),
                      ),
                      if (_application.role != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          _application.role!,
                          style: AppTextStyles.darkSubtitle,
                        ),
                      ],
                    ],
                  ),
                ),
                ApplicationStatusBadge(
                  status: _application.status,
                  onTap: _openStatusUpdate,
                ),
              ],
            ),
            const SizedBox(height: 20),
            _detailRow(
              'Source',
              _platformLabels[_application.platformId] ??
                  _application.platformId,
            ),
            const SizedBox(height: 10),
            _detailRow('Applied', _formatDate(_application.appliedAt)),
            const SizedBox(height: 10),
            _detailRow('Last updated', _formatDate(_application.updatedAt)),
            if (_application.userDetails?.hasAny ?? false) ...[
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Your details',
                      style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
                    ),
                  ),
                  if (_canEditDetails)
                    TextButton(
                      onPressed: _openDetailsEdit,
                      child: Text(
                        _application.userDetails!.hasAny
                            ? 'Edit details'
                            : 'Add details',
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              if (_application.userDetails?.location != null) ...[
                _detailRow('Location', _application.userDetails!.location!),
                const SizedBox(height: 8),
              ],
              if (_application.userDetails?.salary != null) ...[
                _detailRow(
                  'Salary',
                  formatSalaryDisplay(_application.userDetails!.salary!),
                ),
                const SizedBox(height: 8),
              ],
              if (_application.userDetails?.numberOfRounds != null) ...[
                _detailRow(
                  'Rounds',
                  '${_application.userDetails!.numberOfRounds}',
                ),
                const SizedBox(height: 8),
              ],
              if (_application.userDetails?.workMode != null) ...[
                _detailRow(
                  'Work mode',
                  _formatWorkMode(_application.userDetails!.workMode!),
                ),
                const SizedBox(height: 8),
              ],
              if (_application.userDetails?.notes != null)
                _detailRow('Notes', _application.userDetails!.notes!),
            ] else if (_canEditDetails) ...[
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: _openDetailsEdit,
                  child: const Text('Add details'),
                ),
              ),
            ],
            if (_hasExtractedDetails(_application.extractedDetails)) ...[
              const SizedBox(height: 20),
              Text(
                'From email',
                style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
              ),
              const SizedBox(height: 8),
              if (_application.extractedDetails?.role != null) ...[
                _detailRow('Role', _application.extractedDetails!.role!),
                const SizedBox(height: 8),
              ],
              if (_application.extractedDetails?.salary != null) ...[
                _detailRow(
                  'Salary',
                  formatSalaryDisplay(_application.extractedDetails!.salary!),
                ),
                const SizedBox(height: 8),
              ],
              if (_application.extractedDetails?.location != null) ...[
                _detailRow(
                  'Location',
                  _application.extractedDetails!.location!,
                ),
                const SizedBox(height: 8),
              ],
              if (_application.extractedDetails?.employmentType != null)
                _detailRow(
                  'Type',
                  _application.extractedDetails!.employmentType!,
                ),
            ],
            if (widget.showStatusHistory) ...[
              const SizedBox(height: 20),
              Text(
                'Status history',
                style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
              ),
              const SizedBox(height: 12),
              if (_loading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                Text(_error!, style: AppTextStyles.darkSubtitle)
              else
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _StatusHistoryTimeline(
                          entries: _detail?.statusHistory ?? const [],
                        ),
                        if ((_detail?.companyApplications?.length ?? 0) >
                            1) ...[
                          const SizedBox(height: 20),
                          Text(
                            'At this company',
                            style: AppTextStyles.featureTitle.copyWith(
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ..._detail!.companyApplications!.map(
                            (sibling) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      sibling.role ?? 'Unknown role',
                                      style: AppTextStyles.darkSubtitle
                                          .copyWith(fontSize: 13),
                                    ),
                                  ),
                                  Text(
                                    formatStatusLabel(sibling.status),
                                    style: AppTextStyles.darkStatCaption,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    _formatShortDate(sibling.appliedAt),
                                    style: AppTextStyles.darkStatCaption,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Close'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.darkStatCaption),
        Text(
          value,
          style: AppTextStyles.featureTitle.copyWith(fontSize: 13),
        ),
      ],
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

  String _formatShortDate(DateTime date) {
    final local = date.toLocal();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[local.month - 1]} ${local.day}';
  }

  bool _hasExtractedDetails(ApplicationExtractedDetails? details) {
    if (details == null) return false;
    return details.role != null ||
        details.salary != null ||
        details.location != null ||
        details.employmentType != null;
  }

  String _formatWorkMode(String mode) {
    if (mode.isEmpty) return mode;
    return mode[0].toUpperCase() + mode.substring(1);
  }
}

class _StatusHistoryTimeline extends StatelessWidget {
  const _StatusHistoryTimeline({required this.entries});

  final List<StatusHistoryEntry> entries;

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) {
      return Text(
        'No status history yet.',
        style: AppTextStyles.darkSubtitle,
      );
    }

    return Column(
      children: [
        for (var i = 0; i < entries.length; i++)
          _StatusHistoryTile(
            entry: entries[i],
            isLast: i == entries.length - 1,
          ),
      ],
    );
  }
}

class _StatusHistoryTile extends StatelessWidget {
  const _StatusHistoryTile({
    required this.entry,
    required this.isLast,
  });

  final StatusHistoryEntry entry;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(entry.status);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
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
              padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
              child: Text(
                '${formatStatusLabel(entry.status)} — ${_formatShortDate(entry.changedAt)}',
                style: AppTextStyles.darkSubtitle.copyWith(fontSize: 13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatShortDate(DateTime date) {
    final local = date.toLocal();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[local.month - 1]} ${local.day}';
  }
}

class _CompanyAvatar extends StatelessWidget {
  const _CompanyAvatar({required this.name, this.size = 40});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final hue = name.hashCode.abs() % 360;

    return CircleAvatar(
      radius: size / 2,
      backgroundColor:
          HSLColor.fromAHSL(1, hue.toDouble(), 0.45, 0.55).toColor(),
      child: Text(
        initial,
        style: TextStyle(
          color: AppColors.white,
          fontWeight: FontWeight.w700,
          fontSize: size * 0.38,
        ),
      ),
    );
  }
}
