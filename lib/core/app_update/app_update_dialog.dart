import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/app_release_info.dart';
import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class AppUpdateDialog extends StatelessWidget {
  const AppUpdateDialog({
    super.key,
    required this.info,
    required this.onLater,
  });

  final AppReleaseInfo info;
  final VoidCallback onLater;

  static Future<void> show(
    BuildContext context, {
    required AppReleaseInfo info,
    required VoidCallback onLater,
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: !info.forceUpdate,
      builder: (_) => AppUpdateDialog(info: info, onLater: onLater),
    );
  }

  Future<void> _downloadApk(BuildContext context) async {
    final url = info.apkUrl;
    if (url == null || url.isEmpty) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Download link is not available yet')),
      );
      return;
    }

    final uri = Uri.parse(url);
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open download link')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasDownload = info.apkUrl != null && info.apkUrl!.isNotEmpty;

    return PopScope(
      canPop: !info.forceUpdate,
      child: AlertDialog(
        backgroundColor: AppColors.white,
        title: Text(
          info.forceUpdate ? 'Update required' : 'Update available',
          style: AppTextStyles.darkGreeting.copyWith(fontSize: 18),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Version ${info.latestVersion} is ready to install.',
              style: AppTextStyles.darkSubtitle,
            ),
            if (info.releaseNotes.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                info.releaseNotes,
                style: AppTextStyles.featureTitle.copyWith(fontSize: 14),
              ),
            ],
            if (!hasDownload) ...[
              const SizedBox(height: 12),
              Text(
                'Ask your admin to publish an APK download link.',
                style: AppTextStyles.darkSubtitle.copyWith(
                  color: AppColors.warning,
                ),
              ),
            ],
          ],
        ),
        actions: [
          if (!info.forceUpdate)
            TextButton(
              onPressed: () {
                onLater();
                Navigator.of(context).pop();
              },
              child: const Text('Later'),
            ),
          FilledButton(
            onPressed: hasDownload ? () => _downloadApk(context) : null,
            style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Download APK'),
          ),
        ],
      ),
    );
  }
}
