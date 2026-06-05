import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage._();

  static const _key = 'jobpulse_access_token';
  static const _secure = FlutterSecureStorage();

  static Future<void> save(String token) async {
    await _secure.write(key: _key, value: token);
  }

  static Future<String?> read() async {
    return _secure.read(key: _key);
  }

  static Future<void> clear() async {
    await _secure.delete(key: _key);
  }
}
