import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';
import '../auth/token_storage.dart';
import '../config/app_config.dart';
import '../models/application.dart';
import '../models/user_profile.dart';
import 'sync_cancelled_exception.dart';

class UserApi {
  UserApi._();

  static final UserApi instance = UserApi._();

  http.Client? _syncClient;
  bool _syncCancelRequested = false;

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

  Future<UserSyncState> runSync({
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    cancelSync(requested: false);

    final token = await _token();
    final payload = <String, String>{};
    if (fromDate != null) {
      payload['fromDate'] = fromDate.toIso8601String().substring(0, 10);
    }
    if (toDate != null) {
      payload['toDate'] = toDate.toIso8601String().substring(0, 10);
    }

    final client = http.Client();
    _syncClient = client;

    try {
      final response = await client.post(
        Uri.parse('${AppConfig.apiBaseUrl}/sync'),
        headers: _headers(token),
        body: jsonEncode(payload),
      );

      if (response.statusCode != 200) {
        throw AuthException('Sync failed');
      }

      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return UserSyncState.fromJson(body);
    } on Exception catch (e) {
      if (_syncCancelRequested) {
        throw SyncCancelledException();
      }
      if (e is AuthException || e is SyncCancelledException) rethrow;
      if (e is http.ClientException || e is SocketException) {
        throw AuthException('Sync interrupted. Check your connection.');
      }
      rethrow;
    } finally {
      if (_syncClient == client) {
        _syncClient = null;
      }
      client.close();
      _syncCancelRequested = false;
    }
  }

  void cancelSync({bool requested = true}) {
    _syncCancelRequested = requested;
    _syncClient?.close();
    _syncClient = null;
  }

  Future<List<JobApplication>> fetchApplications() async {
    final token = await _token();
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}/applications'),
      headers: _headers(token),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to load applications');
    }

    final body = jsonDecode(response.body);
    if (body is! List) return [];
    return body
        .map((e) => JobApplication.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<UserSyncState> finalizeSyncStats() async {
    final token = await _token();
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/sync/finalize'),
      headers: _headers(token),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to finalize sync stats');
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
