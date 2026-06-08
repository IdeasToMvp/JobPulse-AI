import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';

import '../config/app_config.dart';
import '../models/app_release_info.dart';

class AppReleaseApi {
  AppReleaseApi._();

  static final AppReleaseApi instance = AppReleaseApi._();

  Future<AppReleaseInfo?> fetchAndroidUpdate() async {
    final packageInfo = await PackageInfo.fromPlatform();
    final buildNumber = int.tryParse(packageInfo.buildNumber) ?? 1;
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/app/android-update').replace(
      queryParameters: {
        'version': packageInfo.version,
        'buildNumber': buildNumber.toString(),
      },
    );

    try {
      final response = await http.get(uri);
      if (response.statusCode != 200) return null;
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return AppReleaseInfo.fromJson(json);
    } catch (_) {
      return null;
    }
  }
}
