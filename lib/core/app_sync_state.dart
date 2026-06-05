import 'package:flutter/foundation.dart';

import 'api/sync_cancelled_exception.dart';
import 'api/user_api.dart';
import 'models/user_profile.dart';

enum SyncButtonState { idle, syncing, success }

enum SyncStep {
  idle,
  connecting,
  scanningPlatforms,
  discoveringCompanies,
  searchingCompanyEmails,
  finalizing,
  complete,
}

enum SyncFrequency {
  every30Minutes('Every 30 Minutes', 30),
  everyHour('Every Hour', 60),
  every6Hours('Every 6 Hours', 360),
  every12Hours('Every 12 Hours', 720),
  every24Hours('Every 24 Hours', 1440),
  manual('Manual Only', 0);

  const SyncFrequency(this.label, this.minutes);
  final String label;
  final int minutes;

  static SyncFrequency fromMinutes(int minutes) {
    return SyncFrequency.values.firstWhere(
      (f) => f.minutes == minutes,
      orElse: () => SyncFrequency.every30Minutes,
    );
  }
}

class AppSyncState extends ChangeNotifier {
  AppSyncState._();

  static final AppSyncState instance = AppSyncState._();

  bool isGmailSynced = false;
  SyncButtonState syncButtonState = SyncButtonState.idle;
  SyncStep syncStep = SyncStep.idle;
  String? syncStepDetail;

  String userName = '';
  String userEmail = '';
  String memberSince = '';

  bool autoSyncEnabled = true;
  SyncFrequency syncFrequency = SyncFrequency.every30Minutes;
  String? initialSyncMode;
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

  bool get isNewOnlyMode => initialSyncMode == 'new_only';

  bool get canRunIncrementalSync => sync.hasSynced && sync.lastSyncedAt != null;

  bool get showNoResultsMessage =>
      hasSyncedData && !hasStatsData && initialSyncMode == 'import_history';

  bool get hasStatsData =>
      sync.emailsProcessed > 0 ||
      sync.applicationsCount > 0 ||
      sync.interviewsCount > 0 ||
      sync.offersCount > 0;

  int get emailsProcessed => sync.emailsProcessed;
  int get applicationsFound => sync.applicationsCount;

  int get syncProgressStepIndex {
    switch (syncStep) {
      case SyncStep.connecting:
        return 0;
      case SyncStep.scanningPlatforms:
        return 1;
      case SyncStep.discoveringCompanies:
        return 2;
      case SyncStep.searchingCompanyEmails:
        return 3;
      case SyncStep.finalizing:
      case SyncStep.complete:
        return 4;
      case SyncStep.idle:
        return 0;
    }
  }

  double get syncProgressFraction {
    if (syncStep == SyncStep.complete) return 1;
    if (syncStep == SyncStep.idle) return 0;
    return (syncProgressStepIndex + 0.5) / 5;
  }

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
    autoSyncEnabled = profile.syncSettings.autoSyncEnabled;
    syncFrequency =
        SyncFrequency.fromMinutes(profile.syncSettings.syncFrequencyMinutes);
    initialSyncMode = profile.syncSettings.initialSyncMode;
    selectedPlatformIds
      ..clear()
      ..addAll(profile.jobSources);
    notifyListeners();
  }

  void disconnectGmail() {
    isGmailSynced = false;
    syncButtonState = SyncButtonState.idle;
    syncStep = SyncStep.idle;
    syncStepDetail = null;
    userName = '';
    userEmail = '';
    memberSince = '';
    initialSyncMode = null;
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

  Future<void> saveSyncSettings() async {
    final profile = await UserApi.instance.updateSyncSettings(
      autoSyncEnabled: autoSyncEnabled,
      syncFrequencyMinutes: syncFrequency.minutes,
    );
    applyProfile(profile);
  }

  Future<void> setupNewOnlyTracking(Set<String> ids) async {
    final profile = await UserApi.instance.setupNewOnlySync(ids);
    applyProfile(profile);
  }

  void setAutoSync(bool value) {
    autoSyncEnabled = value;
    notifyListeners();
  }

  Future<void> persistAutoSync(bool value) async {
    setAutoSync(value);
    await saveSyncSettings();
  }

  void setSyncFrequency(SyncFrequency value) {
    syncFrequency = value;
    notifyListeners();
  }

  Future<void> persistSyncFrequency(SyncFrequency value) async {
    setSyncFrequency(value);
    await saveSyncSettings();
  }

  void setNotification(String key, bool value) {
    notificationSettings[key] = value;
    notifyListeners();
  }

  void _setSyncStep(SyncStep step, {String? detail}) {
    syncStep = step;
    syncStepDetail = detail;
    notifyListeners();
  }

  Future<void> runSync({
    DateTime? fromDate,
    DateTime? toDate,
    bool incrementalOnly = false,
  }) async {
    if (syncButtonState == SyncButtonState.syncing) return;
    syncButtonState = SyncButtonState.syncing;
    _setSyncStep(
      SyncStep.connecting,
      detail: incrementalOnly
          ? 'Checking for new emails since last sync'
          : 'Verifying secure access',
    );

    await UserApi.instance.beginSyncSession();

    try {
      _setSyncStep(
        SyncStep.scanningPlatforms,
        detail: 'LinkedIn, Naukri, Indeed, and your other sources',
      );
      final platformResult = await UserApi.instance.runPlatformSync(
        fromDate: fromDate,
        toDate: toDate,
        incrementalOnly: incrementalOnly,
      );

      UserApi.instance.ensureSyncNotAborted();

      _setSyncStep(
        SyncStep.discoveringCompanies,
        detail: platformResult.companiesDiscovered > 0
            ? '${platformResult.companiesDiscovered} companies identified'
            : 'Identifying employers from platform emails',
      );

      _setSyncStep(
        SyncStep.searchingCompanyEmails,
        detail: 'Recruiter replies and company domain mail',
      );
      final companyResult = await UserApi.instance.runCompanySync(
        fromDate: fromDate,
        toDate: toDate,
        incrementalOnly: incrementalOnly,
      );

      UserApi.instance.ensureSyncNotAborted();

      if (companyResult.companiesScanned == 0) {
        syncStepDetail = 'No company domains to search yet';
        notifyListeners();
      } else {
        syncStepDetail =
            'Scanned ${companyResult.companiesScanned} companies';
        notifyListeners();
      }

      _setSyncStep(SyncStep.finalizing, detail: 'Computing stats and updates');
      final result = await UserApi.instance.finalizeSync(
        fromDate: platformResult.fromDate,
        toDate: platformResult.toDate,
        maxInternalDate: platformResult.maxInternalDate,
        newMessages: platformResult.newMessages,
        skippedProcessed:
            platformResult.skippedProcessed + companyResult.skippedProcessed,
        aiCalls: platformResult.aiCalls + companyResult.aiCalls,
        companyEmailsProcessed: companyResult.companyEmailsProcessed,
        companiesDiscovered: platformResult.companiesDiscovered,
        companiesScanned: companyResult.companiesScanned,
      );

      sync = result;
      if (result.scan != null) {
        scanRange = '${result.scan!.fromDate} → ${result.scan!.toDate}';
      }
      if (kDebugMode) {
        debugPrint(
          'Sync complete → emails: ${result.emailsProcessed}, '
          'apps: ${result.applicationsCount}, '
          'companies: ${result.scan?.companiesDiscovered ?? 0}',
        );
      }

      _setSyncStep(SyncStep.complete);
      syncButtonState = SyncButtonState.success;
      notifyListeners();

      await Future<void>.delayed(const Duration(milliseconds: 600));
      syncButtonState = SyncButtonState.idle;
      syncStep = SyncStep.idle;
      syncStepDetail = null;
      notifyListeners();
    } on SyncCancelledException {
      syncButtonState = SyncButtonState.idle;
      syncStep = SyncStep.finalizing;
      syncStepDetail = 'Saving progress…';
      notifyListeners();
      try {
        sync = await UserApi.instance.finalizeSyncStats();
        if (sync.scan != null) {
          scanRange = '${sync.scan!.fromDate} → ${sync.scan!.toDate}';
        }
      } catch (_) {
        try {
          await refreshProfile();
        } catch (_) {}
      }
      syncStep = SyncStep.idle;
      syncStepDetail = null;
      notifyListeners();
    } catch (_) {
      syncButtonState = SyncButtonState.idle;
      syncStep = SyncStep.idle;
      syncStepDetail = null;
      notifyListeners();
      rethrow;
    } finally {
      UserApi.instance.endSyncSession();
    }
  }

  Future<void> runIncrementalSync() => runSync(incrementalOnly: true);

  Future<void> cancelSync() async {
    if (syncButtonState != SyncButtonState.syncing) return;
    await UserApi.instance.cancelSync();
  }

  Future<void> deleteAllData() async {
    final profile = await UserApi.instance.clearUserData();
    applyProfile(profile);
  }
}
