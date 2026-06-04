import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../login/login_screen.dart';
import 'widgets/onboarding_feature_card.dart';
import 'widgets/onboarding_hero.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  static const _horizontalPadding = 20.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.onboardingBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: _horizontalPadding),
          child: Column(
            children: [
              const SizedBox(height: 8),
              const OnboardingHero(),
              const SizedBox(height: 12),
              Text(
                'Never lose track of a job application again',
                style: AppTextStyles.onboardingHeadline,
                textAlign: TextAlign.center,
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: Column(
                  children: [
                    Expanded(
                      child: _featureCard(
                        icon: Icons.sync_rounded,
                        iconBackground: AppColors.onboardingIconPurple,
                        iconColor: AppColors.primary,
                        title: 'Auto-track applications',
                        description:
                            'Instantly syncs new applications from your inbox.',
                      ),
                    ),
                    const SizedBox(height: 6),
                    Expanded(
                      child: _featureCard(
                        icon: Icons.calendar_month_rounded,
                        iconBackground: AppColors.onboardingIconLavender,
                        iconColor: AppColors.secondary,
                        title: 'Detect interviews automatically',
                        description:
                            'AI maps calendar invites to your job tracking funnel.',
                      ),
                    ),
                    const SizedBox(height: 6),
                    Expanded(
                      child: _featureCard(
                        icon: Icons.chat_bubble_outline_rounded,
                        iconBackground: AppColors.onboardingIconPeach,
                        iconColor: AppColors.tertiary,
                        title: 'Track recruiter conversations',
                        description:
                            'Thread all communications in one unified view.',
                      ),
                    ),
                    const SizedBox(height: 6),
                    Expanded(
                      child: _featureCard(
                        icon: Icons.insights_rounded,
                        iconBackground: AppColors.onboardingIconSlate,
                        iconColor: AppColors.neutral,
                        title: 'Generate career insights',
                        description:
                            'Visual data to improve your application conversion.',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute<void>(
                        builder: (_) => const LoginScreen(),
                      ),
                    );
                  },
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    elevation: 0,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Continue', style: AppTextStyles.continueButton),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward_rounded, size: 18),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'By continuing, you agree to our Terms of Service and Privacy Policy.',
                style: AppTextStyles.onboardingFooter,
                textAlign: TextAlign.center,
                maxLines: 2,
              ),
              const SizedBox(height: 6),
            ],
          ),
        ),
      ),
    );
  }

  Widget _featureCard({
    required IconData icon,
    required Color iconBackground,
    required Color iconColor,
    required String title,
    required String description,
  }) {
    return Align(
      alignment: Alignment.center,
      child: OnboardingFeatureCard(
        icon: icon,
        iconBackground: iconBackground,
        iconColor: iconColor,
        title: title,
        description: description,
      ),
    );
  }
}

