import 'package:flutter/foundation.dart';

class AppConfig {
  static const productionApiBaseUrl =
      'https://jobpulse-ai-production.up.railway.app/api/v1';

  static const localApiBaseUrl = 'http://127.0.0.1:3000/api/v1';

  /// Override with `--dart-define=API_BASE_URL=https://...`
  static const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

  /// Use Railway API while running debug builds:
  /// `flutter run --dart-define=USE_PROD_API=true`
  static const _useProdApi = bool.fromEnvironment('USE_PROD_API');

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    if (_useProdApi || !kDebugMode) return productionApiBaseUrl;
    return localApiBaseUrl;
  }

  static const oauthCallbackScheme = 'jobpulse';
  static const oauthCallbackHost = 'auth';
  static const oauthCallbackPath = '/callback';
}
