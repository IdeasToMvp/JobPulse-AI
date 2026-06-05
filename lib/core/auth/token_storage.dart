import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TokenStorage {
  TokenStorage._();

  static const _key = 'jobpulse_access_token';
  static const _secure = FlutterSecureStorage();

  static Future<void> save(String token) async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, token);
      return;
    }
    await _secure.write(key: _key, value: token);
  }

  static Future<String?> read() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_key);
    }
    return _secure.read(key: _key);
  }

  static Future<void> clear() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_key);
      return;
    }
    await _secure.delete(key: _key);
  }
}
