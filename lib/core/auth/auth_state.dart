import 'package:flutter/foundation.dart';

import '../app_sync_state.dart';
import 'auth_service.dart';
import 'auth_user.dart';
import 'token_storage.dart';

/// Bridges persisted Google login with in-app [AppSyncState].
class AuthState extends ChangeNotifier {
  AuthState._();

  static final AuthState instance = AuthState._();

  bool isAuthenticated = false;
  String? accessToken;
  AuthUser? user;
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

  void _applySession(String token, AuthUser profile) {
    accessToken = token;
    user = profile;
    isAuthenticated = true;

    final sync = AppSyncState.instance;
    sync.userName = profile.name;
    sync.userEmail = profile.email;
    sync.isGmailSynced = true;
    sync.memberSince = _formatMemberSince(DateTime.now());
    sync.notifyListeners();
  }

  void _clearLocal() {
    isAuthenticated = false;
    accessToken = null;
    user = null;

    final sync = AppSyncState.instance;
    sync.disconnectGmail();
    sync.userName = '';
    sync.userEmail = '';
    sync.notifyListeners();
  }

  String _formatMemberSince(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${months[date.month - 1]} ${date.year}';
  }
}
