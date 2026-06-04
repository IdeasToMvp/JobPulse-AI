import 'package:flutter/foundation.dart';

enum SyncButtonState { idle, syncing, success }

enum SyncFrequency {
  every15Minutes('Every 15 Minutes', 15),
  every30Minutes('Every 30 Minutes', 30),
  everyHour('Every Hour', 60),
  every6Hours('Every 6 Hours', 360),
  every12Hours('Every 12 Hours', 720),
  manual('Manual Only', 0);

  const SyncFrequency(this.label, this.minutes);
  final String label;
  final int minutes;
}

/// In-memory app state until real Gmail OAuth and API are integrated.
class AppSyncState extends ChangeNotifier {
  AppSyncState._();

  static final AppSyncState instance = AppSyncState._();

  bool isGmailSynced = false;
  SyncButtonState syncButtonState = SyncButtonState.idle;

  String userName = 'Jaswinder Singh';
  String userEmail = 'jaswinder@gmail.com';
  String memberSince = 'Jun 2026';

  bool autoSyncEnabled = true;
  SyncFrequency syncFrequency = SyncFrequency.every30Minutes;
  int lastSyncMinutesAgo = 5;
  String scanRange = 'Last 1 Year';

  int emailsProcessed = 482;
  int applicationsFound = 74;

  final Set<String> selectedPlatformIds = {
    'linkedin',
    'naukri',
    'indeed',
    'career_pages',
  };

  final Map<String, bool> notificationSettings = {
    'interview_alerts': true,
    'offer_alerts': true,
    'recruiter_outreach': true,
    'new_opportunities': true,
    'application_updates': true,
    'rejected_notifications': false,
  };

  String get nextScheduledSyncLabel {
    if (!autoSyncEnabled || syncFrequency == SyncFrequency.manual) {
      return 'Manual only';
    }
    final remaining = syncFrequency.minutes - lastSyncMinutesAgo;
    if (remaining <= 0) return 'Due now';
    if (remaining < 60) return 'In $remaining minutes';
    final hours = (remaining / 60).ceil();
    return 'In $hours hour${hours == 1 ? '' : 's'}';
  }

  String get lastSyncLabel =>
      lastSyncMinutesAgo <= 1 ? 'Just now' : '$lastSyncMinutesAgo minutes ago';

  void connectGmail() {
    if (isGmailSynced) return;
    isGmailSynced = true;
    notifyListeners();
  }

  void disconnectGmail() {
    isGmailSynced = false;
    syncButtonState = SyncButtonState.idle;
    notifyListeners();
  }

  void reset() {
    isGmailSynced = false;
    syncButtonState = SyncButtonState.idle;
    notifyListeners();
  }

  void setAutoSync(bool value) {
    autoSyncEnabled = value;
    notifyListeners();
  }

  void setSyncFrequency(SyncFrequency value) {
    syncFrequency = value;
    notifyListeners();
  }

  void setNotification(String key, bool value) {
    notificationSettings[key] = value;
    notifyListeners();
  }

  void updatePlatformSelection(Set<String> ids) {
    selectedPlatformIds
      ..clear()
      ..addAll(ids);
    notifyListeners();
  }

  Future<void> runSync() async {
    if (syncButtonState == SyncButtonState.syncing) return;
    syncButtonState = SyncButtonState.syncing;
    notifyListeners();

    await Future<void>.delayed(const Duration(milliseconds: 4500));

    lastSyncMinutesAgo = 0;
    syncButtonState = SyncButtonState.success;
    notifyListeners();

    await Future<void>.delayed(const Duration(seconds: 2));
    syncButtonState = SyncButtonState.idle;
    lastSyncMinutesAgo = 5;
    notifyListeners();
  }

  void syncNow() => runSync();

  void deleteAllData() {
    emailsProcessed = 0;
    applicationsFound = 0;
    notifyListeners();
  }
}
