import 'dart:async';

import '../app_sync_state.dart';
import 'app_notification_service.dart';

/// Polls for new applications when auto sync is enabled (covers server-side
/// auto sync) and notifies after silent client incremental syncs.
class AutoSyncMonitor {
  AutoSyncMonitor._();

  static final AutoSyncMonitor instance = AutoSyncMonitor._();

  Timer? _timer;
  int _baselineAppliedCount = 0;
  bool _baselineSet = false;
  bool _checking = false;

  void bind(AppSyncState state) {
    state.addListener(_onStateChanged);
    _restartTimer(state);
  }

  void _onStateChanged() {
    _restartTimer(AppSyncState.instance);
  }

  void _restartTimer(AppSyncState state) {
    _timer?.cancel();
    _timer = null;

    if (!state.autoSyncEnabled ||
        state.syncFrequency == SyncFrequency.manual ||
        !state.hasSyncedData) {
      return;
    }

    if (!_baselineSet) {
      resetBaseline(state.sync.appliedCount);
    }

    final interval = Duration(minutes: state.syncFrequency.minutes);
    _timer = Timer.periodic(interval, (_) {
      unawaited(_pollForNewApplications());
    });
  }

  void resetBaseline(int appliedCount) {
    _baselineAppliedCount = appliedCount;
    _baselineSet = true;
  }

  Future<void> onAppResumed() async {
    final state = AppSyncState.instance;
    if (!state.autoSyncEnabled || !state.hasSyncedData) return;

    try {
      await state.refreshProfile();
      final delta = state.sync.appliedCount - _baselineAppliedCount;
      if (delta > 0) {
        await AppNotificationService.instance.showNewApplications(delta);
      }
      resetBaseline(state.sync.appliedCount);
    } catch (_) {}
  }

  Future<void> onAutoSyncEnabled() async {
    await AppNotificationService.instance.requestPermission();
    resetBaseline(AppSyncState.instance.sync.appliedCount);
    _restartTimer(AppSyncState.instance);
  }

  Future<void> onAutoSyncDisabled() async {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _pollForNewApplications() async {
    final state = AppSyncState.instance;
    if (!state.autoSyncEnabled || !state.hasSyncedData || _checking) return;
    if (state.syncButtonState == SyncButtonState.syncing) return;

    _checking = true;
    try {
      if (state.canRunIncrementalSync) {
        final newApps = await state.runBackgroundIncrementalSync();
        if (newApps > 0) {
          await AppNotificationService.instance.showNewApplications(newApps);
        }
        resetBaseline(AppSyncState.instance.sync.appliedCount);
        return;
      }

      await state.refreshProfile();
      final delta = state.sync.appliedCount - _baselineAppliedCount;
      if (delta > 0) {
        await AppNotificationService.instance.showNewApplications(delta);
      }
      resetBaseline(state.sync.appliedCount);
    } catch (_) {
      // Ignore background poll errors.
    } finally {
      _checking = false;
    }
  }
}
