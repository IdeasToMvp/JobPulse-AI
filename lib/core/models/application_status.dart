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
    case 'interview':
      return AppColors.warning;
    case 'offer':
      return AppColors.success;
    case 'rejected':
    case 'ghosted':
      return AppColors.error;
    default:
      return AppColors.secondary;
  }
}

bool isManualStatus(String status) {
  return manualApplicationStatuses.contains(status);
}
