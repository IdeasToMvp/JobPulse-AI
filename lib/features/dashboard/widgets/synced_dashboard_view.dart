import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/gmail_application.dart';

class SyncedDashboardView extends StatelessWidget {
  const SyncedDashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    final applications = GmailApplication.sampleAnalysis;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Gmail Analysis',
                  style: AppTextStyles.connectGmailTitle.copyWith(fontSize: 24),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'SYNCED',
                      style: AppTextStyles.trackingBadge.copyWith(
                        color: AppColors.success,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Applications detected from your inbox scan.',
            style: AppTextStyles.connectGmailBody,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _statCard('${applications.length}', 'Found'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _statCard('2', 'Interviews'),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _statCard('1', 'Active'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Text('Recent Detections', style: AppTextStyles.dashboardSectionTitle),
          const SizedBox(height: 12),
          ...applications.map(_applicationTile),
        ],
      ),
    );
  }

  Widget _statCard(String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.dashboardCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.platformsCardBorder),
      ),
      child: Column(
        children: [
          Text(value, style: AppTextStyles.dashboardStatValue),
          const SizedBox(height: 4),
          Text(label, style: AppTextStyles.dashboardStatLabel),
        ],
      ),
    );
  }

  Widget _applicationTile(GmailApplication app) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.dashboardCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.platformsCardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.business_rounded,
              color: AppColors.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(app.company, style: AppTextStyles.featureTitle),
                const SizedBox(height: 2),
                Text(app.role, style: AppTextStyles.featureDescription),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: app.statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        app.status,
                        style: AppTextStyles.trackingBadge.copyWith(
                          color: app.statusColor,
                          fontSize: 9,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      app.platform,
                      style: AppTextStyles.dashboardStatLabel,
                    ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            app.detectedAt,
            style: AppTextStyles.dashboardStatLabel.copyWith(fontSize: 10),
          ),
        ],
      ),
    );
  }
}
