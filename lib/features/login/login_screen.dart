import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../platforms/platforms_screen.dart';
import 'widgets/google_logo.dart';
import 'widgets/login_hero_icon.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.loginGradientTop,
              AppColors.loginGradientBottom,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                child: _buildHeader(),
              ),
              const SizedBox(height: 20),
              const LoginHeroIcon(),
              const SizedBox(height: 20),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Text(
                  'Sync your trajectory',
                  style: AppTextStyles.loginHeroTitle,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'Connect your account to let JobPulse AI organize your career moves.',
                  style: AppTextStyles.loginHeroSubtitle,
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 20),
              Expanded(child: _buildActionCard(context)),
              const SizedBox(height: 12),
              _buildFooterStatus(),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Text('JobPulse AI', style: AppTextStyles.loginAppTitle),
        const Spacer(),
        const Icon(Icons.lock_outline_rounded, size: 14, color: AppColors.primary),
        const SizedBox(width: 4),
        Text('SECURE LOGIN', style: AppTextStyles.loginSecureLabel),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      decoration: BoxDecoration(
        color: AppColors.loginCardBg,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _googleSignInButton(context),
          const SizedBox(height: 20),
          _enterpriseDivider(),
          const SizedBox(height: 16),
          _securityBox(),
          const Spacer(),
          _legalText(),
        ],
      ),
    );
  }

  Widget _googleSignInButton(BuildContext context) {
    return SizedBox(
      height: 52,
      child: OutlinedButton(
        onPressed: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(
              builder: (_) => const PlatformsScreen(),
            ),
          );
        },
        style: OutlinedButton.styleFrom(
          backgroundColor: AppColors.white,
          foregroundColor: AppColors.onboardingTitle,
          side: const BorderSide(color: AppColors.loginDivider),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const GoogleLogo(size: 22),
            const SizedBox(width: 12),
            Text('Continue with Google', style: AppTextStyles.loginGoogleButton),
          ],
        ),
      ),
    );
  }

  Widget _enterpriseDivider() {
    return Row(
      children: [
        const Expanded(child: Divider(color: AppColors.loginDivider, height: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10),
          child: Text(
            'ENTERPRISE SECURITY',
            style: AppTextStyles.loginDividerLabel,
          ),
        ),
        const Expanded(child: Divider(color: AppColors.loginDivider, height: 1)),
      ],
    );
  }

  Widget _securityBox() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.loginSecurityBox,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.shield_outlined,
            size: 22,
            color: AppColors.secondary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SECURITY-FIRST MESSAGING',
                  style: AppTextStyles.loginSecurityTitle,
                ),
                const SizedBox(height: 6),
                Text(
                  'We only access emails related to your job search. Your private correspondence remains strictly confidential.',
                  style: AppTextStyles.loginSecurityBody,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _legalText() {
    return RichText(
      textAlign: TextAlign.center,
      text: TextSpan(
        style: AppTextStyles.loginLegal,
        children: [
          const TextSpan(text: 'BY CONTINUING, YOU AGREE TO OUR '),
          TextSpan(
            text: 'TERMS OF SERVICE',
            style: AppTextStyles.loginLegalLink,
          ),
          const TextSpan(text: ' & '),
          TextSpan(
            text: 'PRIVACY POLICY',
            style: AppTextStyles.loginLegalLink,
          ),
        ],
      ),
    );
  }

  Widget _buildFooterStatus() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: const BoxDecoration(
            color: AppColors.secondary,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'AI-POWERED THREAT DETECTION ACTIVE',
          style: AppTextStyles.loginFooterStatus,
        ),
      ],
    );
  }
}
