import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTextStyles {
  static TextStyle splashTitle = GoogleFonts.inter(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    color: AppColors.white,
    height: 1.2,
  );

  static TextStyle splashSubtitle = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: AppColors.white.withValues(alpha: 0.85),
    height: 1.4,
  );

  static TextStyle splashStatus = GoogleFonts.jetBrainsMono(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 1.2,
    color: AppColors.neutral,
  );

  static TextStyle onboardingHeadline = GoogleFonts.inter(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.onboardingTitle,
    height: 1.2,
  );

  static TextStyle featureTitle = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.onboardingTitle,
    height: 1.2,
  );

  static TextStyle featureDescription = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingBody,
    height: 1.3,
  );

  static TextStyle onboardingFooter = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingFooter,
    height: 1.4,
  );

  static TextStyle continueButton = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.white,
  );

  static TextStyle trackingBadge = GoogleFonts.jetBrainsMono(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.6,
    color: AppColors.primary,
  );

  static TextStyle loginAppTitle = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle loginSecureLabel = GoogleFonts.jetBrainsMono(
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.8,
    color: AppColors.loginMuted,
  );

  static TextStyle loginHeroTitle = GoogleFonts.inter(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: AppColors.onboardingTitle,
    height: 1.2,
  );

  static TextStyle loginHeroSubtitle = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingBody,
    height: 1.4,
  );

  static TextStyle loginGoogleButton = GoogleFonts.inter(
    fontSize: 15,
    fontWeight: FontWeight.w600,
    color: AppColors.onboardingTitle,
  );

  static TextStyle loginDividerLabel = GoogleFonts.jetBrainsMono(
    fontSize: 9,
    fontWeight: FontWeight.w600,
    letterSpacing: 1,
    color: AppColors.loginMuted,
  );

  static TextStyle loginSecurityTitle = GoogleFonts.jetBrainsMono(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.5,
    color: AppColors.secondary,
  );

  static TextStyle loginSecurityBody = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingBody,
    height: 1.4,
  );

  static TextStyle loginLegal = GoogleFonts.inter(
    fontSize: 10,
    fontWeight: FontWeight.w400,
    color: AppColors.loginMuted,
    height: 1.35,
  );

  static TextStyle loginLegalLink = GoogleFonts.inter(
    fontSize: 10,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle loginFooterStatus = GoogleFonts.jetBrainsMono(
    fontSize: 9,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.6,
    color: AppColors.loginMuted,
  );

  static TextStyle platformsTitle = GoogleFonts.inter(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.onboardingTitle,
    height: 1.2,
  );

  static TextStyle platformsSubtitle = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingBody,
    height: 1.3,
  );

  static TextStyle platformLabel = GoogleFonts.jetBrainsMono(
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.4,
    color: AppColors.primary,
  );

  static TextStyle benefitsHeader = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle benefitItem = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingBody,
    height: 1.25,
  );

  static TextStyle connectGmailTitle = GoogleFonts.inter(
    fontSize: 26,
    fontWeight: FontWeight.w700,
    color: AppColors.onboardingTitle,
    height: 1.2,
  );

  static TextStyle connectGmailBody = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.onboardingBody,
    height: 1.45,
  );

  static TextStyle connectHubTitle = GoogleFonts.inter(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle connectHubSubtitle = GoogleFonts.jetBrainsMono(
    fontSize: 10,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.8,
    color: AppColors.dashboardMuted,
  );

  static TextStyle dashboardSectionTitle = GoogleFonts.inter(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: AppColors.onboardingTitle,
  );

  static TextStyle dashboardStatValue = GoogleFonts.inter(
    fontSize: 24,
    fontWeight: FontWeight.w700,
    color: AppColors.primary,
  );

  static TextStyle dashboardStatLabel = GoogleFonts.inter(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    color: AppColors.dashboardMuted,
  );

  static TextStyle navLabel = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w600,
  );
}
