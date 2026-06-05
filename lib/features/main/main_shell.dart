import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import '../../core/auth/auth_state.dart';
import '../../core/theme/app_colors.dart';
import '../account/account_screen.dart';
import '../login/login_screen.dart';
import '../dashboard/dashboard_tab.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const _tabs = [
    _NavItem(icon: Icons.home_rounded, label: 'Dashboard'),
    _NavItem(icon: Icons.work_outline_rounded, label: 'Applications'),
    _NavItem(icon: Icons.notifications_outlined, label: 'Activity'),
    _NavItem(icon: Icons.person_outline_rounded, label: 'Account'),
  ];

  @override
  void initState() {
    super.initState();
    unawaited(AppSyncState.instance.refreshProfile());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!AuthState.instance.isAuthenticated && mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
          (_) => false,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.dashboardBackground,
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: const [
            DashboardTab(),
            ApplicationsTab(),
            ActivityTab(),
            AccountScreen(),
          ],
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        backgroundColor: AppColors.white,
        indicatorColor: AppColors.secondary.withValues(alpha: 0.2),
        surfaceTintColor: Colors.transparent,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          for (final tab in _tabs)
            NavigationDestination(
              icon: Icon(tab.icon),
              selectedIcon: Icon(tab.icon, color: AppColors.secondary),
              label: tab.label,
            ),
        ],
      ),
    );
  }
}

class _NavItem {
  const _NavItem({required this.icon, required this.label});

  final IconData icon;
  final String label;
}
