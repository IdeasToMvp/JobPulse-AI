import 'package:flutter/material.dart';

class GmailApplication {
  const GmailApplication({
    required this.company,
    required this.role,
    required this.status,
    required this.platform,
    required this.detectedAt,
    required this.statusColor,
  });

  final String company;
  final String role;
  final String status;
  final String platform;
  final String detectedAt;
  final Color statusColor;

  static const List<GmailApplication> sampleAnalysis = [
    GmailApplication(
      company: 'Google',
      role: 'Senior Software Engineer',
      status: 'Interview Scheduled',
      platform: 'LinkedIn',
      detectedAt: '2 hours ago',
      statusColor: Color(0xFF8B5CF6),
    ),
    GmailApplication(
      company: 'Stripe',
      role: 'Product Manager',
      status: 'Applied',
      platform: 'Indeed',
      detectedAt: 'Yesterday',
      statusColor: Color(0xFF2E3192),
    ),
    GmailApplication(
      company: 'Notion',
      role: 'Growth Marketing Lead',
      status: 'Recruiter Reply',
      platform: 'Wellfound',
      detectedAt: '2 days ago',
      statusColor: Color(0xFF22C55E),
    ),
    GmailApplication(
      company: 'Airbnb',
      role: 'Data Analyst',
      status: 'Assessment',
      platform: 'Career Pages',
      detectedAt: '3 days ago',
      statusColor: Color(0xFFF59E0B),
    ),
    GmailApplication(
      company: 'Spotify',
      role: 'Backend Engineer',
      status: 'Rejected',
      platform: 'Referrals',
      detectedAt: '5 days ago',
      statusColor: Color(0xFFEF4444),
    ),
  ];
}
