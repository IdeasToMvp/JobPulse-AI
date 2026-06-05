import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_web_auth_2/flutter_web_auth_2.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/user_profile.dart';
import 'oauth_url_cleaner.dart';
import 'token_storage.dart';

class AuthException implements Exception {
  AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}

class AuthService {
  AuthService._();

  static final AuthService instance = AuthService._();

  /// On web, Google OAuth redirects back with `?token=` and reloads the app.
  /// Returns true when a token was captured from the URL.
  Future<bool> consumeWebOAuthCallbackIfPresent() async {
    if (!kIsWeb) return false;

    final uri = Uri.base;
    final error = uri.queryParameters['error'];
    if (error != null && error.isNotEmpty) {
      clearOAuthQueryFromBrowserUrl();
      throw AuthException(Uri.decodeComponent(error));
    }

    final token = uri.queryParameters['token'];
    if (token == null || token.isEmpty) return false;

    await TokenStorage.save(token);
    clearOAuthQueryFromBrowserUrl();
    return true;
  }

  Future<UserProfile> signInWithGoogle() async {
    final clientRedirect = Uri.encodeComponent(AppConfig.oauthClientRedirectUri);
    final urlResponse = await http.get(
      Uri.parse(
        '${AppConfig.apiBaseUrl}/auth/google/url'
        '?clientRedirectUri=$clientRedirect',
      ),
    );

    if (urlResponse.statusCode != 200) {
      throw AuthException(
        'Could not start Google sign-in (${urlResponse.statusCode}). '
        'Is the backend running?',
      );
    }

    final urlBody = jsonDecode(urlResponse.body) as Map<String, dynamic>;
    final authUrl = urlBody['authUrl'] as String?;

    if (authUrl == null || authUrl.isEmpty) {
      throw AuthException('Invalid auth URL from server');
    }

    final callback = await FlutterWebAuth2.authenticate(
      url: authUrl,
      callbackUrlScheme: AppConfig.oauthCallbackSchemeForAuth,
      options: const FlutterWebAuth2Options(
        preferEphemeral: false,
      ),
    );

    final callbackUri = Uri.parse(callback);
    final error = callbackUri.queryParameters['error'];
    if (error != null && error.isNotEmpty) {
      throw AuthException(Uri.decodeComponent(error));
    }

    final token = callbackUri.queryParameters['token'];
    if (token == null || token.isEmpty) {
      throw AuthException('Sign-in completed but no session token was returned');
    }

    await TokenStorage.save(token);
    return fetchCurrentUser(token);
  }

  Future<UserProfile?> restoreSession() async {
    final token = await TokenStorage.read();
    if (token == null) return null;

    try {
      return await fetchCurrentUser(token);
    } catch (e) {
      debugPrint('Session restore failed: $e');
      await TokenStorage.clear();
      return null;
    }
  }

  Future<UserProfile> fetchCurrentUser(String token) async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}/auth/me'),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode != 200) {
      throw AuthException('Session expired. Please sign in again.');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final userJson = body['user'] as Map<String, dynamic>?;
    if (userJson == null) {
      throw AuthException('Invalid user profile from server');
    }

    return UserProfile.fromJson(userJson);
  }

  Future<void> signOut() async {
    final token = await TokenStorage.read();
    if (token != null) {
      try {
        await http.post(
          Uri.parse('${AppConfig.apiBaseUrl}/auth/logout'),
          headers: {'Authorization': 'Bearer $token'},
        );
      } catch (e) {
        debugPrint('Logout API call failed: $e');
      }
    }
    await TokenStorage.clear();
  }
}
