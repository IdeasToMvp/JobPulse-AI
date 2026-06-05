import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/auth/auth_service.dart';
import '../../core/auth/auth_state.dart';
import '../../core/app_sync_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../main/main_shell.dart';
import '../onboarding/onboarding_screen.dart';
import '../platforms/platforms_screen.dart';
import 'widgets/splash_hero.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _progressController;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..forward();

    unawaited(_bootstrap());
  }

  Future<void> _bootstrap() async {
    // Pick up OAuth token immediately on web reload (before splash delay).
    try {
      await AuthService.instance.consumeWebOAuthCallbackIfPresent();
    } on AuthException {
      // Error query param handled; fall through to restoreSession/onboarding.
    }

    await Future<void>.delayed(const Duration(seconds: 2));
    if (!mounted) return;

    final hasSession = await AuthState.instance.restoreSession();
    if (!mounted) return;

    final Widget next;
    if (hasSession) {
      next = AppSyncState.instance.selectedPlatformIds.isEmpty
          ? const PlatformsScreen()
          : const MainShell();
    } else {
      next = const OnboardingScreen();
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => next),
    );
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.splashGradientBottom,
      body: SizedBox.expand(
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                AppColors.splashGradientTop,
                AppColors.splashGradientBottom,
              ],
            ),
            border: Border.fromBorderSide(
              BorderSide(color: AppColors.splashBorder, width: 1),
            ),
          ),
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: SizedBox(
                width: double.infinity,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SplashHero(),
                    const SizedBox(height: 40),
                    Text('JobPulse AI', style: AppTextStyles.splashTitle),
                    const SizedBox(height: 12),
                    Text(
                      'Your AI-powered job application tracker',
                      style: AppTextStyles.splashSubtitle,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 40),
                    _buildProgressBar(),
                    const SizedBox(height: 16),
                    Text(
                      'ANALYZING INBOXES...',
                      style: AppTextStyles.splashStatus,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProgressBar() {
    return AnimatedBuilder(
      animation: _progressController,
      builder: (context, child) {
        final barWidth = MediaQuery.sizeOf(context).width - 64;
        return SizedBox(
          width: barWidth,
          height: 6,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: _progressController.value,
              backgroundColor: AppColors.white.withValues(alpha: 0.12),
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.splashProgress,
              ),
            ),
          ),
        );
      },
    );
  }
}
