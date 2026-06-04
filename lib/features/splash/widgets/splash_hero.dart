import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Animated network graphic: center node pulses; three satellites bob vertically.
class SplashHero extends StatefulWidget {
  const SplashHero({super.key});

  @override
  State<SplashHero> createState() => _SplashHeroState();
}

class _SplashHeroState extends State<SplashHero> with TickerProviderStateMixin {
  static const double _size = 220;
  static const double _centerSize = 96;
  static const double _satelliteSize = 48;
  static const double _bobAmplitude = 10;

  late final AnimationController _pulseController;
  late final AnimationController _bobController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _bobController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    _pulseAnimation = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _bobController.dispose();
    super.dispose();
  }

  double _bobOffset(double phase) {
    return math.sin((_bobController.value * 2 * math.pi) + phase) *
        _bobAmplitude;
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _size,
      height: _size,
      child: AnimatedBuilder(
        animation: Listenable.merge([_pulseController, _bobController]),
        builder: (context, child) {
          final center = Offset(_size / 2, _size / 2);
          final top = Offset(_size / 2, 28 + _bobOffset(0));
          final left = Offset(36, _size / 2 + _bobOffset(2 * math.pi / 3));
          final right =
              Offset(_size - 36, _size / 2 + _bobOffset(4 * math.pi / 3));

          return Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: const Size(_size, _size),
                painter: _ConnectorPainter(
                  center: center,
                  satellites: [top, left, right],
                ),
              ),
              _satelliteNode(
                offset: top,
                icon: Icons.mail_outline_rounded,
              ),
              _satelliteNode(
                offset: left,
                icon: Icons.forward_to_inbox_rounded,
              ),
              _satelliteNode(
                offset: right,
                icon: Icons.auto_awesome_rounded,
              ),
              Transform.scale(
                scale: _pulseAnimation.value,
                child: _centerNode(),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _centerNode() {
    return Container(
      width: _centerSize,
      height: _centerSize,
      decoration: BoxDecoration(
        color: AppColors.splashNodeFill,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.splashIconTint, width: 1),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(
            Icons.grid_view_rounded,
            size: 40,
            color: AppColors.white.withValues(alpha: 0.95),
          ),
          Positioned(
            right: 18,
            bottom: 18,
            child: Icon(
              Icons.add_rounded,
              size: 18,
              color: AppColors.white.withValues(alpha: 0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _satelliteNode({required Offset offset, required IconData icon}) {
    return Positioned(
      left: offset.dx - _satelliteSize / 2,
      top: offset.dy - _satelliteSize / 2,
      child: Container(
        width: _satelliteSize,
        height: _satelliteSize,
        decoration: BoxDecoration(
          color: AppColors.splashNodeFill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.splashIconTint, width: 1),
        ),
        child: Icon(icon, size: 22, color: AppColors.splashIconTint),
      ),
    );
  }
}

class _ConnectorPainter extends CustomPainter {
  _ConnectorPainter({
    required this.center,
    required this.satellites,
  });

  final Offset center;
  final List<Offset> satellites;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.splashConnector
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    for (final satellite in satellites) {
      canvas.drawLine(center, satellite, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ConnectorPainter oldDelegate) {
    return oldDelegate.center != center ||
        oldDelegate.satellites != satellites;
  }
}
