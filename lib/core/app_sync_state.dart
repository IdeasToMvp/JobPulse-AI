import 'package:flutter/foundation.dart';

/// Temporary in-memory sync flag until real Gmail OAuth is wired up.
class AppSyncState extends ChangeNotifier {
  AppSyncState._();

  static final AppSyncState instance = AppSyncState._();

  bool isGmailSynced = false;

  void connectGmail() {
    if (isGmailSynced) return;
    isGmailSynced = true;
    notifyListeners();
  }

  void reset() {
    isGmailSynced = false;
    notifyListeners();
  }
}
