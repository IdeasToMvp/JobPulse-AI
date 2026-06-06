import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

const manualApplicationStatuses = [
  'applied',
  'active',
  'interview',
  'offer',
  'rejected',
];

String formatStatusLabel(String status) {
  if (status.isEmpty) return status;
  return status[0].toUpperCase() + status.substring(1);
}

Color statusColor(String status) {
  switch (status) {
    case 'applied':
      return StatusColors.applied;
    case 'active':
    case 'assessment':
      return StatusColors.assessment;
    case 'interview':
      return StatusColors.interview;
    case 'offer':
      return StatusColors.offer;
    case 'rejected':
      return StatusColors.rejected;
    case 'ghosted':
      return StatusColors.ghosted;
    default:
      return AppColors.secondary;
  }
}

class StatusCardTheme {
  const StatusCardTheme({
    required this.accent,
    required this.background,
    required this.border,
  });

  final Color accent;
  final Color background;
  final Color border;
}

StatusCardTheme statusCardTheme(String status) {
  final accent = statusColor(status);
  return StatusCardTheme(
    accent: accent,
    background: accent.withValues(alpha: 0.06),
    border: accent.withValues(alpha: 0.25),
  );
}

bool isManualStatus(String status) {
  return manualApplicationStatuses.contains(status);
}
