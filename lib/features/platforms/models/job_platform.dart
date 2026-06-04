import 'package:flutter/material.dart';

class JobPlatform {
  const JobPlatform({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;

  static const List<JobPlatform> all = [
    JobPlatform(id: 'linkedin', label: 'LINKEDIN', icon: Icons.groups_rounded),
    JobPlatform(id: 'naukri', label: 'NAUKRI', icon: Icons.send_rounded),
    JobPlatform(
      id: 'indeed',
      label: 'INDEED',
      icon: Icons.check_circle_outline_rounded,
    ),
    JobPlatform(
      id: 'instahyre',
      label: 'INSTAHYRE',
      icon: Icons.bolt_rounded,
    ),
    JobPlatform(
      id: 'wellfound',
      label: 'WELLFOUND',
      icon: Icons.rocket_launch_rounded,
    ),
    JobPlatform(
      id: 'foundit',
      label: 'FOUNDIT',
      icon: Icons.person_search_rounded,
    ),
    JobPlatform(
      id: 'glassdoor',
      label: 'GLASSDOOR',
      icon: Icons.door_front_door_outlined,
    ),
    JobPlatform(
      id: 'career_pages',
      label: 'CAREER PAGES',
      icon: Icons.business_rounded,
    ),
    JobPlatform(
      id: 'referrals',
      label: 'REFERRALS',
      icon: Icons.handshake_rounded,
    ),
  ];
}
