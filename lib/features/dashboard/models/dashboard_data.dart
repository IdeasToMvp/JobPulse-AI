import 'package:flutter/material.dart';

class DashboardStats {
  const DashboardStats({
    required this.applications,
    required this.active,
    required this.interviews,
    required this.offers,
  });

  final int applications;
  final int active;
  final int interviews;
  final int offers;

  static const sample = DashboardStats(
    applications: 74,
    active: 18,
    interviews: 7,
    offers: 1,
  );
}

class AttentionItem {
  const AttentionItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    this.tag,
    this.tagColor,
    this.dimmed = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final String? tag;
  final Color? tagColor;
  final bool dimmed;

  static const sample = [
    AttentionItem(
      title: 'Microsoft Interview',
      subtitle: 'Tomorrow at 11:00 AM',
      icon: Icons.window_rounded,
      iconColor: Color(0xFF00A4EF),
      tag: 'PRIORITY',
      tagColor: Color(0xFF8B5CF6),
    ),
    AttentionItem(
      title: 'PayU Assessment',
      subtitle: 'Expiring soon',
      icon: Icons.bar_chart_rounded,
      iconColor: Color(0xFF2E3192),
      tag: '12H LEFT',
      tagColor: Color(0xFFEF4444),
    ),
    AttentionItem(
      title: 'Google',
      subtitle: 'No response for 30 days',
      icon: Icons.hourglass_bottom_rounded,
      iconColor: Color(0xFF6B7280),
      dimmed: true,
    ),
  ];
}

class ActivityItem {
  const ActivityItem({
    required this.title,
    required this.timeAgo,
  });

  final String title;
  final String timeAgo;

  static const sample = [
    ActivityItem(
      title: 'Microsoft Interview Scheduled',
      timeAgo: '2 hours ago',
    ),
    ActivityItem(
      title: 'Amazon Assessment Received',
      timeAgo: 'Yesterday',
    ),
  ];
}

class SyncInfo {
  const SyncInfo({
    required this.lastSync,
    required this.emailsProcessed,
  });

  final String lastSync;
  final String emailsProcessed;

  static const sample = SyncInfo(
    lastSync: '484',
    emailsProcessed: '482',
  );
}
