import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../auth/auth_service.dart';
import '../auth/token_storage.dart';
import '../config/app_config.dart';
import '../models/activity.dart';
import '../models/application.dart';
import '../models/sync_phase_result.dart';
import '../models/user_profile.dart';
import 'sync_cancelled_exception.dart';

class UserApi {
  UserApi._();

  static final UserApi instance = UserApi._();

  http.Client? _syncClient;
  bool _syncCancelRequested = false;
  bool syncAbortRequested = false;

  Future<String> _token() async {
    final token = await TokenStorage.read();
    if (token == null) throw AuthException('Not signed in');
    return token;
  }

  Map<String, String> _headers(String token) => {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      };

  Map<String, dynamic> _syncDatePayload({
    DateTime? fromDate,
    DateTime? toDate,
    bool incrementalOnly = false,
  }) {
    final payload = <String, dynamic>{};
    if (fromDate != null) {
      payload['fromDate'] = fromDate.toIso8601String().substring(0, 10);
    }
    if (toDate != null) {
      payload['toDate'] = toDate.toIso8601String().substring(0, 10);
    }
    if (incrementalOnly) {
      payload['incrementalOnly'] = true;
    }
    return payload;
  }

  Future<Map<String, dynamic>> _postSync(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final token = await _token();
    final client = _syncClient ??= http.Client();

    try {
      final response = await client.post(
        Uri.parse('${AppConfig.apiBaseUrl}$path'),
        headers: _headers(token),
        body: jsonEncode(body ?? {}),
      );

      if (response.statusCode == 409) {
        throw SyncCancelledException();
      }

      if (response.statusCode != 200) {
        throw AuthException('Sync failed');
      }

      return jsonDecode(response.body) as Map<String, dynamic>;
    } on Exception catch (e) {
      if (_syncCancelRequested) {
        throw SyncCancelledException();
      }
      if (e is AuthException || e is SyncCancelledException) rethrow;
      if (e is http.ClientException || e is SocketException) {
        throw AuthException('Sync interrupted. Check your connection.');
      }
      rethrow;
    }
  }

  Future<void> beginSyncSession() async {
    syncAbortRequested = false;
    _syncCancelRequested = false;
    _syncClient?.close();
    _syncClient = http.Client();

    try {
      final token = await _token();
      await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/sync/begin'),
        headers: _headers(token),
      );
    } catch (_) {}
  }

  void endSyncSession() {
    _syncClient?.close();
    _syncClient = null;
    _syncCancelRequested = false;
    syncAbortRequested = false;
  }

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

  Future<UserProfile> updateSyncSettings({
    required bool autoSyncEnabled,
    required int syncFrequencyMinutes,
  }) async {
    final token = await _token();
    final response = await http.put(
      Uri.parse('${AppConfig.apiBaseUrl}/users/sync-settings'),
      headers: _headers(token),
      body: jsonEncode({
        'autoSyncEnabled': autoSyncEnabled,
        'syncFrequencyMinutes': syncFrequencyMinutes,
      }),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to save sync settings');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson == null) {
      throw AuthException('Invalid sync settings response');
    }
    return UserProfile.fromJson(userJson);
  }

  Future<UserProfile> setupNewOnlySync(Set<String> platformIds) async {
    final token = await _token();
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/users/initial-sync/new-only'),
      headers: _headers(token),
      body: jsonEncode({'platformIds': platformIds.toList()}),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to start new-email tracking');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson == null) {
      throw AuthException('Invalid new-only sync response');
    }
    return UserProfile.fromJson(userJson);
  }

  Future<void> markImportHistorySync() async {
    final token = await _token();
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/users/initial-sync/import-history'),
      headers: _headers(token),
    );

    if (response.statusCode != 200) {
      throw AuthException('Failed to mark import history mode');
    }
  }

  Future<PlatformSyncResult> runPlatformSync({
    DateTime? fromDate,
    DateTime? toDate,
    bool incrementalOnly = false,
  }) async {
    final body = await _postSync(
      '/sync/platform',
      body: _syncDatePayload(
        fromDate: fromDate,
        toDate: toDate,
        incrementalOnly: incrementalOnly,
      ),
    );
    return PlatformSyncResult.fromJson(body);
  }

  Future<CompanySyncResult> runCompanySync({
    DateTime? fromDate,
    DateTime? toDate,
    bool incrementalOnly = false,
  }) async {
    final body = await _postSync(
      '/sync/companies',
      body: _syncDatePayload(
        fromDate: fromDate,
        toDate: toDate,
        incrementalOnly: incrementalOnly,
      ),
    );
    return CompanySyncResult.fromJson(body);
  }

  Future<UserSyncState> finalizeSync({
    required String fromDate,
    required String toDate,
    String? maxInternalDate,
    int newMessages = 0,
    int skippedProcessed = 0,
    int aiCalls = 0,
    int companyEmailsProcessed = 0,
    int companiesDiscovered = 0,
    int companiesScanned = 0,
  }) async {
    final body = await _postSync(
      '/sync/finalize',
      body: {
        'fromDate': fromDate,
        'toDate': toDate,
        'maxInternalDate': ?maxInternalDate,
        'newMessages': newMessages,
        'skippedProcessed': skippedProcessed,
        'aiCalls': aiCalls,
        'companyEmailsProcessed': companyEmailsProcessed,
        'companiesDiscovered': companiesDiscovered,
        'companiesScanned': companiesScanned,
      },
    );
    return UserSyncState.fromJson(body);
  }

  Future<UserSyncState> runSync({
    DateTime? fromDate,
    DateTime? toDate,
  }) async {
    await beginSyncSession();
    try {
      final body = await _postSync(
        '/sync',
        body: _syncDatePayload(fromDate: fromDate, toDate: toDate),
      );
      return UserSyncState.fromJson(body);
    } finally {
      endSyncSession();
    }
  }

  Future<void> cancelSync({bool requested = true}) async {
    if (requested) {
      syncAbortRequested = true;
      try {
        final token = await _token();
        await http.post(
          Uri.parse('${AppConfig.apiBaseUrl}/sync/cancel'),
          headers: _headers(token),
        );
      } catch (_) {}
    }

    _syncCancelRequested = requested;
    _syncClient?.close();
    _syncClient = null;
  }

  void ensureSyncNotAborted() {
    if (syncAbortRequested) {
      throw SyncCancelledException();
    }
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

  Future<ActivityPage> fetchActivities({
    ActivityFilter filter = ActivityFilter.all,
    int offset = 0,
    int limit = 20,
  }) async {
    final token = await _token();
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/activities').replace(
      queryParameters: {
        'type': filter.apiValue,
        'offset': '$offset',
        'limit': '$limit',
      },
    );
    final response = await http.get(uri, headers: _headers(token));

    if (response.statusCode != 200) {
      throw AuthException('Failed to load activity');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return ActivityPage.fromJson(body);
  }

  Future<UserSyncState> finalizeSyncStats() async {
    final token = await _token();
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}/sync/finalize'),
      headers: _headers(token),
      body: jsonEncode({}),
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
