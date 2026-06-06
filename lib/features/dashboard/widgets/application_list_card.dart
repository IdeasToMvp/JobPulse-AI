import 'package:flutter/material.dart';

import '../../../core/models/application.dart';
import '../../../core/models/application_status.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'application_status_badge.dart';

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

class ApplicationListCard extends StatelessWidget {
  const ApplicationListCard({
    super.key,
    required this.application,
    required this.onTap,
    required this.onStatusTap,
    required this.displaySalary,
    required this.displayLocation,
    required this.formatDate,
  });

  final JobApplication application;
  final VoidCallback onTap;
  final VoidCallback onStatusTap;
  final String? Function(JobApplication app) displaySalary;
  final String? Function(JobApplication app) displayLocation;
  final String Function(DateTime date) formatDate;

  @override
  Widget build(BuildContext context) {
    final theme = statusCardTheme(application.status);
    const radius = 16.0;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: Ink(
          decoration: BoxDecoration(
            color: theme.background,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: theme.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 4,
                    color: theme.accent,
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  application.company,
                                  style: AppTextStyles.featureTitle,
                                ),
                                if ((application.companyApplyCount ?? 0) >
                                    1) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    '${application.companyApplyCount} applications'
                                    '${application.companyRoles != null && application.companyRoles!.isNotEmpty ? ' · ${application.companyRoles!.join(', ')}' : ''}',
                                    style: AppTextStyles.darkStatCaption
                                        .copyWith(
                                      color: AppColors.secondary,
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                                if (application.role != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    application.role!,
                                    style: AppTextStyles.darkSubtitle,
                                  ),
                                ],
                                const SizedBox(height: 6),
                                if (displaySalary(application) != null ||
                                    displayLocation(application) != null) ...[
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 4,
                                    children: [
                                      if (displaySalary(application) != null)
                                        _infoChip(displaySalary(application)!),
                                      if (displayLocation(application) != null)
                                        _infoChip(
                                          displayLocation(application)!,
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                ],
                                Text(
                                  _platformLabels[application.platformId] ??
                                      application.platformId,
                                  style: AppTextStyles.darkStatCaption,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Applied ${formatDate(application.appliedAt)}',
                                  style: AppTextStyles.darkStatCaption,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Updated ${formatDate(application.updatedAt)}',
                                  style: AppTextStyles.darkStatCaption.copyWith(
                                    color: AppColors.secondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ApplicationStatusBadge(
                            status: application.status,
                            onTap: onStatusTap,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
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
}
