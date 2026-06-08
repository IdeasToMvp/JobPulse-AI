import 'dart:io';

import 'package:flutter/material.dart';

import '../api/app_release_api.dart';
import '../models/app_release_info.dart';
import 'app_update_dialog.dart';

class AppUpdateService {
  AppUpdateService._();

  static final AppUpdateService instance = AppUpdateService._();

  int? _dismissedOptionalBuild;

  Future<bool> checkAndPrompt(BuildContext context) async {
    if (!Platform.isAndroid) return true;

    final info = await AppReleaseApi.instance.fetchAndroidUpdate();
    if (info == null || !info.updateAvailable) return true;

    if (!info.forceUpdate && _dismissedOptionalBuild == info.latestBuildNumber) {
      return true;
    }

    if (!context.mounted) return !info.forceUpdate;

    await AppUpdateDialog.show(
      context,
      info: info,
      onLater: () => _dismissedOptionalBuild = info.latestBuildNumber,
    );

    return !info.forceUpdate;
  }

  Future<AppReleaseInfo?> fetchUpdateInfo() {
    if (!Platform.isAndroid) {
      return Future.value(null);
    }
    return AppReleaseApi.instance.fetchAndroidUpdate();
  }
}
