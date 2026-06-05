import 'package:flutter/foundation.dart';

import '../app_sync_state.dart';
import '../models/user_profile.dart';
import 'auth_service.dart';
import 'token_storage.dart';

class AuthState extends ChangeNotifier {
  AuthState._();

  static final AuthState instance = AuthState._();

  bool isAuthenticated = false;
  String? accessToken;
  UserProfile? user;
  bool isLoading = false;

  Future<bool> restoreSession() async {
    isLoading = true;
    notifyListeners();

    try {
      final token = await TokenStorage.read();
      if (token == null) {
        _clearLocal();
        return false;
      }

      final profile = await AuthService.instance.fetchCurrentUser(token);
      _applySession(token, profile);
      return true;
    } catch (_) {
      await AuthService.instance.signOut();
      _clearLocal();
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signInWithGoogle() async {
    isLoading = true;
    notifyListeners();

    try {
      final profile = await AuthService.instance.signInWithGoogle();
      final token = await TokenStorage.read();
      if (token == null) {
        throw AuthException('Failed to persist session');
      }
      _applySession(token, profile);
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await AuthService.instance.signOut();
    _clearLocal();
    notifyListeners();
  }

  void _applySession(String token, UserProfile profile) {
    accessToken = token;
    user = profile;
    isAuthenticated = true;
    AppSyncState.instance.applyProfile(profile);
  }

  void _clearLocal() {
    isAuthenticated = false;
    accessToken = null;
    user = null;
    AppSyncState.instance.disconnectGmail();
  }
}
