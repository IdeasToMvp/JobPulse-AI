import 'dart:convert';

import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';
import '../auth/token_storage.dart';
import '../config/app_config.dart';
import '../models/user_profile.dart';

class UserApi {
  UserApi._();

  static final UserApi instance = UserApi._();

  Future<String> _token() async {
    final token = await TokenStorage.read();
    if (token == null) throw AuthException('Not signed in');
    return token;
  }

  Map<String, String> _headers(String token) => {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

  Future<UserProfile> fetchProfile() async {
    final token = await _token();
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}/auth/me'),
      headers: _headers(token),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to load profile');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson == null) throw AuthException('Invalid profile response');
    return UserProfile.fromJson(userJson);
  }

  Future<UserProfile> updateJobSources(Set<String> platformIds) async {
    final token = await _token();
    final response = await http.put(
      Uri.parse('${AppConfig.apiBaseUrl}/users/job-sources'),
      headers: _headers(token),
      body: jsonEncode({'platformIds': platformIds.toList()}),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to save job sources');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson == null) throw AuthException('Invalid job sources response');
    return UserProfile.fromJson(userJson);
  }

  Future<UserSyncState> runSync() async {
    final token = await _token();
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/sync'),
      headers: _headers(token),
    );

    if (response.statusCode != 200) {
      throw AuthException('Sync failed');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return UserSyncState.fromJson(body);
  }

  Future<UserProfile> clearUserData() async {
    final token = await _token();
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/users/data/clear'),
      headers: _headers(token),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to clear data');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson == null) throw AuthException('Invalid clear data response');
    return UserProfile.fromJson(userJson);
  }
}
