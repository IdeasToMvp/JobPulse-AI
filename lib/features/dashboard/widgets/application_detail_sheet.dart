import 'package:flutter/material.dart';

import '../../../core/models/application.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

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

class ApplicationDetailSheet extends StatelessWidget {
  const ApplicationDetailSheet({super.key, required this.application});

  final JobApplication application;

  static Future<void> show(BuildContext context, JobApplication application) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => ApplicationDetailSheet(application: application),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        20 + MediaQuery.paddingOf(context).bottom,
      ),
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
              _CompanyAvatar(name: application.company, size: 48),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      application.company,
                      style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
                    ),
                    if (application.role != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        application.role!,
                        style: AppTextStyles.darkSubtitle,
                      ),
                    ],
                  ],
                ),
              ),
              _StatusBadge(status: application.status),
            ],
          ),
          const SizedBox(height: 20),
          _detailRow(
            'Source',
            _platformLabels[application.platformId] ?? application.platformId,
          ),
          const SizedBox(height: 10),
          _detailRow('Applied', _formatDate(application.appliedAt)),
          const SizedBox(height: 10),
          _detailRow('Last updated', _formatDate(application.updatedAt)),
          const SizedBox(height: 20),
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
      backgroundColor: HSLColor.fromAHSL(1, hue.toDouble(), 0.45, 0.55).toColor(),
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

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
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
        style: AppTextStyles.darkCardTag.copyWith(color: color, fontSize: 10),
      ),
    );
  }
}
