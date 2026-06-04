import 'package:flutter/material.dart';

/// Simplified multi-color Google "G" mark for the sign-in button.
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key, this.size = 20});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleLogoPainter()),
    );
  }
}

class _GoogleLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width * 0.42;
    const stroke = 3.0;

    Paint arcPaint(Color color) {
      return Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round;
    }

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -1.2,
      1.6,
      false,
      arcPaint(const Color(0xFFEA4335)),
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      0.4,
      1.4,
      false,
      arcPaint(const Color(0xFFFBBC05)),
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      1.8,
      1.4,
      false,
      arcPaint(const Color(0xFF34A853)),
    );
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      3.2,
      1.6,
      false,
      arcPaint(const Color(0xFF4285F4)),
    );

    canvas.drawRect(
      Rect.fromLTWH(center.dx, center.dy - stroke / 2, radius, stroke),
      Paint()..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
