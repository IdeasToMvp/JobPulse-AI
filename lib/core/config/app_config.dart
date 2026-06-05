/// Local backend URL for iOS Simulator (backend runs on the same Mac).
class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:3000/api/v1',
  );

  static const oauthCallbackScheme = 'jobpulse';
  static const oauthCallbackHost = 'auth';
  static const oauthCallbackPath = '/callback';
}
