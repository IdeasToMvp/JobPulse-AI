import 'package:flutter/material.dart';

import '../../../core/models/application_status.dart';
import '../../../core/theme/app_text_styles.dart';

class ApplicationStatusBadge extends StatelessWidget {
  const ApplicationStatusBadge({
    super.key,
    required this.status,
    this.onTap,
  });

  final String status;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    final badge = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            status.toUpperCase(),
            style: AppTextStyles.darkCardTag.copyWith(
              color: color,
              fontSize: 10,
            ),
          ),
          if (onTap != null) ...[
            const SizedBox(width: 4),
            Icon(Icons.expand_more_rounded, size: 14, color: color),
          ],
        ],
      ),
    );

    if (onTap == null) return badge;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: badge,
      ),
    );
  }
}
