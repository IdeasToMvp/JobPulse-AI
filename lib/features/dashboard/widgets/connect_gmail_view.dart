import 'package:flutter/material.dart';

import '../../../core/app_sync_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import 'sync_hub_hero.dart';

class ConnectGmailView extends StatelessWidget {
  const ConnectGmailView({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.onboardingBackground,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 8),
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SyncHubHero(),
          const SizedBox(height: 12),
          Text(
            'Connect your Gmail',
            style: AppTextStyles.connectGmailTitle.copyWith(fontSize: 22),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            'Let our AI automate your career tracking by scanning your inbox for application updates.',
            style: AppTextStyles.connectGmailBody.copyWith(fontSize: 13),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          _infoCard(
            icon: Icons.filter_alt_outlined,
            title: 'Targeted Analysis',
            description:
                'We only analyze emails related to your selected job platforms like LinkedIn, Indeed, and Greenhouse.',
          ),
          const SizedBox(height: 8),
          _infoCard(
            icon: Icons.lock_outline_rounded,
            title: 'Privacy Guaranteed',
            description:
                'Your personal messages remain private. No human at JobPulse AI ever reads your emails.',
          ),
          const Spacer(),
          SizedBox(
            height: 48,
            child: FilledButton.icon(
              onPressed: AppSyncState.instance.connectGmail,
              icon: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.white, width: 1.5),
                ),
                child: const Icon(Icons.mail, size: 11, color: AppColors.white),
              ),
              label: Text(
                'Connect Gmail',
                style: AppTextStyles.continueButton.copyWith(fontSize: 15),
              ),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'BY CONNECTING, YOU AGREE TO OUR TERMS OF SERVICE REGARDING AI DATA PROCESSING.',
            style: AppTextStyles.loginFooterStatus.copyWith(
              color: AppColors.dashboardMuted,
              fontSize: 8,
              height: 1.35,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
      ),
    );
  }

  Widget _infoCard({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.dashboardCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.platformsCardBorder),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: const BoxDecoration(
              color: AppColors.onboardingIconLavender,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.secondary, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTextStyles.featureTitle.copyWith(fontSize: 13),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: AppTextStyles.featureDescription.copyWith(fontSize: 11),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
