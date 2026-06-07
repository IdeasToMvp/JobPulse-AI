import 'package:flutter/material.dart';

import '../../../core/constants/platform_labels.dart';

class JobPlatform {
  const JobPlatform({
    required this.id,
    required this.icon,
  });

  final String id;
  final IconData icon;

  String get label => platformLabel(id);

  static const List<JobPlatform> all = [
    JobPlatform(id: 'linkedin', icon: Icons.groups_rounded),
    JobPlatform(id: 'naukri', icon: Icons.send_rounded),
    JobPlatform(id: 'indeed', icon: Icons.check_circle_outline_rounded),
    JobPlatform(id: 'instahyre', icon: Icons.bolt_rounded),
    JobPlatform(id: 'wellfound', icon: Icons.rocket_launch_rounded),
    JobPlatform(id: 'foundit', icon: Icons.person_search_rounded),
    JobPlatform(id: 'glassdoor', icon: Icons.door_front_door_outlined),
    JobPlatform(id: 'career_pages', icon: Icons.business_rounded),
    JobPlatform(id: 'referrals', icon: Icons.handshake_rounded),
  ];
}
