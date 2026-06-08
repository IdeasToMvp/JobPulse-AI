import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

class AppConfig {
  static const productionApiBaseUrl =
      'https://jobpulse-ai-production.up.railway.app/api/v1';

  static const _localPort = 3000;
  static const _apiPath = '/api/v1';

  /// Full URL override: `--dart-define=API_BASE_URL=http://192.168.1.42:3000/api/v1`
  /// Or use `--dart-define-from-file=dev.json` (see dev.json.example).
  static const _apiBaseUrlOverride = String.fromEnvironment('API_BASE_URL');

  /// Host override for physical devices on the same Wi‑Fi:
  /// `flutter run --dart-define=API_HOST=192.168.1.42`
  static const _apiHostOverride = String.fromEnvironment('API_HOST');

  /// Point a debug build at Railway:
  /// `flutter run --dart-define=USE_PROD_API=true`
  static const _useProdApi = bool.fromEnvironment('USE_PROD_API');

  static String get localApiBaseUrl {
    return 'http://$localApiHost:$_localPort$_apiPath';
  }

  /// True when running on a physical iPhone/iPad (not the iOS Simulator).
  static bool get isIOSPhysicalDevice {
    if (kIsWeb || !Platform.isIOS) return false;
    return Platform.environment.containsKey('SIMULATOR_DEVICE_NAME') == false;
  }

  /// Physical phones cannot reach the dev machine via 127.0.0.1 / localhost.
  static bool get requiresLanHostForLocalDev =>
      isUsingLocalBackend &&
      isIOSPhysicalDevice &&
      _apiHostOverride.isEmpty &&
      _apiBaseUrlOverride.isEmpty;

  static String get localDevSetupHint {
    return 'Cannot reach the backend at $localApiBaseUrl from a physical '
        'iPhone. Use your Mac\'s Wi‑Fi IP instead, e.g.\n'
        'flutter run --dart-define=API_HOST=192.168.1.42\n'
        'Or copy dev.json.example to dev.json and run '
        '--dart-define-from-file=dev.json';
  }

  static String get localBackendConnectionErrorMessage {
    if (requiresLanHostForLocalDev) {
      return localDevSetupHint;
    }
    return 'Cannot reach the backend at $apiBaseUrl. '
        'Make sure the Nest server is running on port $_localPort.';
  }

  /// Resolves the machine running the Nest server for local testing.
  static String get localApiHost {
    if (_apiHostOverride.isNotEmpty) return _apiHostOverride;
    if (Platform.isAndroid) return '10.0.2.2';
    return '127.0.0.1';
  }

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) return _apiBaseUrlOverride;
    if (_useProdApi || !kDebugMode) return productionApiBaseUrl;
    return localApiBaseUrl;
  }

  static bool get isUsingLocalBackend =>
      kDebugMode && !_useProdApi && _apiBaseUrlOverride.isEmpty;

  static const oauthCallbackScheme = 'jobpulse';
  static const oauthCallbackHost = 'auth';
  static const oauthCallbackPath = '/callback';

  static String get oauthClientRedirectUri =>
      '$oauthCallbackScheme://$oauthCallbackHost$oauthCallbackPath';

  static String get oauthCallbackSchemeForAuth => oauthCallbackScheme;
}
