import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class SyncHubHero extends StatefulWidget {
  const SyncHubHero({super.key});

  @override
  State<SyncHubHero> createState() => _SyncHubHeroState();
}

class _SyncHubHeroState extends State<SyncHubHero>
    with SingleTickerProviderStateMixin {
  static const double _bobAmplitude = 8;

  late final AnimationController _bobController;

  @override
  void initState() {
    super.initState();
    _bobController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();
  }

  @override
  void dispose() {
    _bobController.dispose();
    super.dispose();
  }

  double _bob(double phase) =>
      math.sin((_bobController.value * 2 * math.pi) + phase) * _bobAmplitude;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bobController,
      builder: (context, child) {
        return Stack(
          clipBehavior: Clip.none,
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 22),
              decoration: BoxDecoration(
                color: AppColors.dashboardCard,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.06),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.connectSecureBadge,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.shield_outlined,
                            size: 12,
                            color: AppColors.primary.withValues(alpha: 0.8),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            'SECURE',
                            style: AppTextStyles.loginSecureLabel.copyWith(
                              color: AppColors.primary,
                              fontSize: 9,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Transform.translate(
                    offset: Offset(0, _bob(0)),
                    child: _hubIllustration(),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Sync Hub',
                    style: AppTextStyles.connectHubTitle.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'OAuth 2.0 PROTECTED',
                    style: AppTextStyles.connectHubSubtitle,
                  ),
                ],
              ),
            ),
            Positioned(
              right: 20,
              bottom: -14,
              child: Transform.translate(
                offset: Offset(0, _bob(math.pi * 0.75)),
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.lock_rounded,
                    color: AppColors.secondary,
                    size: 20,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _hubIllustration() {
    return Container(
      width: 118,
      height: 78,
      decoration: BoxDecoration(
        color: AppColors.connectHubBg,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: 0.28),
            blurRadius: 18,
            spreadRadius: -4,
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Transform.translate(
            offset: Offset(0, _bob(math.pi * 0.35)),
            child: Icon(
              Icons.shield_outlined,
              size: 46,
              color: AppColors.secondary.withValues(alpha: 0.22),
            ),
          ),
          Positioned(
            left: 22,
            child: Transform.translate(
              offset: Offset(0, _bob(math.pi * 1.2)),
              child: Icon(
                Icons.shield_outlined,
                size: 28,
                color: AppColors.secondary.withValues(alpha: 0.38),
              ),
            ),
          ),
          Positioned(
            right: 22,
            child: Transform.translate(
              offset: Offset(0, _bob(math.pi * 1.8)),
              child: Icon(
                Icons.shield_outlined,
                size: 28,
                color: AppColors.secondary.withValues(alpha: 0.38),
              ),
            ),
          ),
          Transform.translate(
            offset: Offset(0, _bob(math.pi * 0.6)),
            child: Icon(
              Icons.mark_email_unread_rounded,
              size: 32,
              color: AppColors.white.withValues(alpha: 0.95),
            ),
          ),
        ],
      ),
    );
  }
}
