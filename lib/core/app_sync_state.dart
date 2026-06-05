import 'package:flutter/foundation.dart';

import 'api/user_api.dart';
import 'models/user_profile.dart';

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

class AppSyncState extends ChangeNotifier {
  AppSyncState._();

  static final AppSyncState instance = AppSyncState._();

  bool isGmailSynced = false;
  SyncButtonState syncButtonState = SyncButtonState.idle;

  String userName = '';
  String userEmail = '';
  String memberSince = '';

  bool autoSyncEnabled = true;
  SyncFrequency syncFrequency = SyncFrequency.every30Minutes;
  String scanRange = 'Last 1 Year';

  UserSyncState sync = const UserSyncState();
  final Set<String> selectedPlatformIds = {};

  final Map<String, bool> notificationSettings = {
    'interview_alerts': true,
    'offer_alerts': true,
    'recruiter_outreach': true,
    'new_opportunities': true,
    'application_updates': true,
    'rejected_notifications': false,
  };

  bool get hasSyncedData => sync.hasSynced;

  int get emailsProcessed => sync.emailsProcessed;
  int get applicationsFound => sync.applicationsCount;

  String get nextScheduledSyncLabel {
    if (!autoSyncEnabled || syncFrequency == SyncFrequency.manual) {
      return 'Manual only';
    }
    if (sync.lastSyncedAt == null) return 'After first sync';
    final minutesAgo = DateTime.now().difference(sync.lastSyncedAt!).inMinutes;
    final remaining = syncFrequency.minutes - minutesAgo;
    if (remaining <= 0) return 'Due now';
    if (remaining < 60) return 'In $remaining minutes';
    final hours = (remaining / 60).ceil();
    return 'In $hours hour${hours == 1 ? '' : 's'}';
  }

  String get lastSyncLabel {
    final last = sync.lastSyncedAt;
    if (last == null) return 'Never';
    final minutesAgo = DateTime.now().difference(last).inMinutes;
    if (minutesAgo <= 1) return 'Just now';
    if (minutesAgo < 60) return '$minutesAgo minutes ago';
    final hours = (minutesAgo / 60).floor();
    if (hours < 24) return '$hours hour${hours == 1 ? '' : 's'} ago';
    final days = (hours / 24).floor();
    return '$days day${days == 1 ? '' : 's'} ago';
  }

  void applyProfile(UserProfile profile) {
    userName = profile.name;
    userEmail = profile.email;
    memberSince = profile.memberSince;
    isGmailSynced = true;
    sync = profile.sync;
    selectedPlatformIds
      ..clear()
      ..addAll(profile.jobSources);
    notifyListeners();
  }

  void disconnectGmail() {
    isGmailSynced = false;
    syncButtonState = SyncButtonState.idle;
    userName = '';
    userEmail = '';
    memberSince = '';
    sync = const UserSyncState();
    selectedPlatformIds.clear();
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    final profile = await UserApi.instance.fetchProfile();
    applyProfile(profile);
  }

  Future<void> saveJobSources(Set<String> ids) async {
    final profile = await UserApi.instance.updateJobSources(ids);
    applyProfile(profile);
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

  Future<void> runSync() async {
    if (syncButtonState == SyncButtonState.syncing) return;
    syncButtonState = SyncButtonState.syncing;
    notifyListeners();

    try {
      final result = await UserApi.instance.runSync();
      sync = result;
      syncButtonState = SyncButtonState.success;
      notifyListeners();

      await Future<void>.delayed(const Duration(seconds: 2));
      syncButtonState = SyncButtonState.idle;
      notifyListeners();
    } catch (_) {
      syncButtonState = SyncButtonState.idle;
      notifyListeners();
      rethrow;
    }
  }

  Future<void> deleteAllData() async {
    final profile = await UserApi.instance.clearUserData();
    applyProfile(profile);
  }
}
