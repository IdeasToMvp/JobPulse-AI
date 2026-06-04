import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/job_platform.dart';

class PlatformCard extends StatelessWidget {
  const PlatformCard({
    super.key,
    required this.platform,
    required this.isSelected,
    required this.onTap,
  });

  final JobPlatform platform;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Ink(
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.platformsCardSelected
                : AppColors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.platformsCardBorder,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                platform.icon,
                size: 22,
                color: AppColors.primary,
              ),
              const SizedBox(height: 6),
              Text(platform.label, style: AppTextStyles.platformLabel),
            ],
          ),
        ),
      ),
    );
  }
}
