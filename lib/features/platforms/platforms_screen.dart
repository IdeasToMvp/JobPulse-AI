import 'package:flutter/material.dart';

import '../../core/app_sync_state.dart';
import '../../core/auth/auth_service.dart';
import '../../core/auth/auth_state.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../login/login_screen.dart';
import '../main/main_shell.dart';
import 'models/job_platform.dart';
import 'widgets/platform_card.dart';

class PlatformsScreen extends StatefulWidget {
  const PlatformsScreen({super.key});

  @override
  State<PlatformsScreen> createState() => _PlatformsScreenState();
}

class _PlatformsScreenState extends State<PlatformsScreen> {
  late final Set<String> _selectedIds =
      Set<String>.from(AppSyncState.instance.selectedPlatformIds);
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!AuthState.instance.isAuthenticated && mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
          (_) => false,
        );
      }
    });
  }

  Future<void> _onContinue() async {
    setState(() => _isSaving = true);
    try {
      await AppSyncState.instance.saveJobSources(_selectedIds);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const MainShell()),
      );
    } on AuthException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save job sources')),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  void _togglePlatform(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.platformsBackground,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),
              _buildHeader(),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: const LinearProgressIndicator(
                  value: 0.75,
                  minHeight: 4,
                  backgroundColor: AppColors.platformsProgressTrack,
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Where do you usually apply for jobs?',
                style: AppTextStyles.platformsTitle,
              ),
              const SizedBox(height: 4),
              Text(
                'Select the platforms you use to help our AI optimize your tracking.',
                style: AppTextStyles.platformsSubtitle,
              ),
              const SizedBox(height: 10),
              Expanded(child: _buildPlatformGrid()),
              const SizedBox(height: 12),
              SizedBox(
                height: 48,
                child: FilledButton(
                  onPressed: _selectedIds.isEmpty || _isSaving
                      ? null
                      : _onContinue,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.white,
                          ),
                        )
                      : Text(
                          'Continue',
                          style: AppTextStyles.continueButton,
                        ),
                ),
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlatformGrid() {
    const crossAxisCount = 2;
    const spacing = 8.0;
    final rowCount = (JobPlatform.all.length / crossAxisCount).ceil();

    return LayoutBuilder(
      builder: (context, constraints) {
        final cellWidth =
            (constraints.maxWidth - spacing) / crossAxisCount;
        final cellHeight =
            (constraints.maxHeight - spacing * (rowCount - 1)) / rowCount;
        final aspectRatio = cellWidth / cellHeight;

        return GridView.builder(
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: spacing,
            crossAxisSpacing: spacing,
            childAspectRatio: aspectRatio,
          ),
          itemCount: JobPlatform.all.length,
          itemBuilder: (context, index) {
            final platform = JobPlatform.all[index];
            return PlatformCard(
              platform: platform,
              isSelected: _selectedIds.contains(platform.id),
              onTap: () => _togglePlatform(platform.id),
            );
          },
        );
      },
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(
            Icons.work_history_rounded,
            size: 18,
            color: AppColors.primary,
          ),
        ),
        const SizedBox(width: 8),
        Text('JobPulse AI', style: AppTextStyles.loginAppTitle),
        const Spacer(),
        CircleAvatar(
          radius: 16,
          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
          child: Icon(
            Icons.person_rounded,
            size: 18,
            color: AppColors.primary.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(width: 10),
        IconButton(
          onPressed: () {},
          icon: const Icon(Icons.sync_rounded, color: AppColors.primary),
          iconSize: 22,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
        ),
      ],
    );
  }
}

