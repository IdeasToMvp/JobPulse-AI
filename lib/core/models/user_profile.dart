class PlatformSyncStats {
  const PlatformSyncStats({
    this.emailsProcessed = 0,
    this.applicationsCount = 0,
    this.interviewsCount = 0,
    this.offersCount = 0,
  });

  final int emailsProcessed;
  final int applicationsCount;
  final int interviewsCount;
  final int offersCount;

  factory PlatformSyncStats.fromJson(Map<String, dynamic> json) {
    return PlatformSyncStats(
      emailsProcessed: json['emailsProcessed'] as int? ?? 0,
      applicationsCount: json['applicationsCount'] as int? ?? 0,
      interviewsCount: json['interviewsCount'] as int? ?? 0,
      offersCount: json['offersCount'] as int? ?? 0,
    );
  }
}

class SyncScanMeta {
  const SyncScanMeta({
    required this.fromDate,
    required this.toDate,
    this.newMessages = 0,
    this.skippedProcessed = 0,
    this.aiCalls = 0,
    this.companiesDiscovered = 0,
    this.companyEmailsProcessed = 0,
    this.companiesScanned = 0,
  });

  final String fromDate;
  final String toDate;
  final int newMessages;
  final int skippedProcessed;
  final int aiCalls;
  final int companiesDiscovered;
  final int companyEmailsProcessed;
  final int companiesScanned;

  factory SyncScanMeta.fromJson(Map<String, dynamic> json) {
    return SyncScanMeta(
      fromDate: json['fromDate'] as String? ?? '',
      toDate: json['toDate'] as String? ?? '',
      newMessages: json['newMessages'] as int? ?? 0,
      skippedProcessed: json['skippedProcessed'] as int? ?? 0,
      aiCalls: json['aiCalls'] as int? ?? 0,
      companiesDiscovered: json['companiesDiscovered'] as int? ?? 0,
      companyEmailsProcessed: json['companyEmailsProcessed'] as int? ?? 0,
      companiesScanned: json['companiesScanned'] as int? ?? 0,
    );
  }
}

class UserSyncSettings {
  const UserSyncSettings({
    this.autoSyncEnabled = true,
    this.syncFrequencyMinutes = 30,
    this.initialSyncMode,
  });

  final bool autoSyncEnabled;
  final int syncFrequencyMinutes;
  final String? initialSyncMode;

  factory UserSyncSettings.fromJson(Map<String, dynamic> json) {
    return UserSyncSettings(
      autoSyncEnabled: json['autoSyncEnabled'] as bool? ?? true,
      syncFrequencyMinutes: json['syncFrequencyMinutes'] as int? ?? 30,
      initialSyncMode: json['initialSyncMode'] as String?,
    );
  }
}

class UserSyncState {
  const UserSyncState({
    this.lastSyncedAt,
    this.emailsProcessed = 0,
    this.applicationsCount = 0,
    this.appliedCount = 0,
    this.activeCount = 0,
    this.interviewsCount = 0,
    this.offersCount = 0,
    this.rejectedCount = 0,
    this.ghostedCount = 0,
    this.hasSynced = false,
    this.scan,
    this.byPlatform = const {},
  });

  final DateTime? lastSyncedAt;
  final int emailsProcessed;
  final int applicationsCount;
  final int appliedCount;
  final int activeCount;
  final int interviewsCount;
  final int offersCount;
  final int rejectedCount;
  final int ghostedCount;
  final bool hasSynced;
  final SyncScanMeta? scan;
  final Map<String, PlatformSyncStats> byPlatform;

  factory UserSyncState.fromJson(Map<String, dynamic> json) {
    final lastSyncedRaw = json['lastSyncedAt'] as String?;
    final byPlatformRaw = json['byPlatform'] as Map<String, dynamic>? ?? {};
    final byPlatform = <String, PlatformSyncStats>{};
    for (final entry in byPlatformRaw.entries) {
      byPlatform[entry.key] = PlatformSyncStats.fromJson(
        entry.value as Map<String, dynamic>,
      );
    }

    return UserSyncState(
      lastSyncedAt:
          lastSyncedRaw != null ? DateTime.tryParse(lastSyncedRaw) : null,
      emailsProcessed: json['emailsProcessed'] as int? ?? 0,
      applicationsCount: json['applicationsCount'] as int? ?? 0,
      appliedCount: json['appliedCount'] as int? ?? 0,
      activeCount: json['activeCount'] as int? ?? 0,
      interviewsCount: json['interviewsCount'] as int? ?? 0,
      offersCount: json['offersCount'] as int? ?? 0,
      rejectedCount: json['rejectedCount'] as int? ?? 0,
      ghostedCount: json['ghostedCount'] as int? ?? 0,
      hasSynced: json['hasSynced'] as bool? ?? false,
      scan: json['scan'] != null
          ? SyncScanMeta.fromJson(json['scan'] as Map<String, dynamic>)
          : null,
      byPlatform: byPlatform,
    );
  }
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.email,
    required this.name,
    this.picture,
    required this.memberSince,
    required this.jobSources,
    required this.syncSettings,
    required this.sync,
  });

  final String id;
  final String email;
  final String name;
  final String? picture;
  final String memberSince;
  final List<String> jobSources;
  final UserSyncSettings syncSettings;
  final UserSyncState sync;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      picture: json['picture'] as String?,
      memberSince: json['memberSince'] as String? ?? '',
      jobSources: (json['jobSources'] as List<dynamic>? ?? [])
          .map((e) => e as String)
          .toList(),
      syncSettings: UserSyncSettings.fromJson(
        json['syncSettings'] as Map<String, dynamic>? ?? {},
      ),
      sync: UserSyncState.fromJson(
        json['sync'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}
