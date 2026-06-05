import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage._();

  static const _key = 'jobpulse_access_token';
  static const _storage = FlutterSecureStorage();

  static Future<void> save(String token) =>
      _storage.write(key: _key, value: token);

  static Future<String?> read() => _storage.read(key: _key);

  static Future<void> clear() => _storage.delete(key: _key);
}
