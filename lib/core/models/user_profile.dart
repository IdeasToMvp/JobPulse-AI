class UserSyncState {
  const UserSyncState({
    this.lastSyncedAt,
    this.emailsProcessed = 0,
    this.applicationsCount = 0,
    this.activeCount = 0,
    this.interviewsCount = 0,
    this.offersCount = 0,
    this.hasSynced = false,
  });

  final DateTime? lastSyncedAt;
  final int emailsProcessed;
  final int applicationsCount;
  final int activeCount;
  final int interviewsCount;
  final int offersCount;
  final bool hasSynced;

  factory UserSyncState.fromJson(Map<String, dynamic> json) {
    final lastSyncedRaw = json['lastSyncedAt'] as String?;
    return UserSyncState(
      lastSyncedAt:
          lastSyncedRaw != null ? DateTime.tryParse(lastSyncedRaw) : null,
      emailsProcessed: json['emailsProcessed'] as int? ?? 0,
      applicationsCount: json['applicationsCount'] as int? ?? 0,
      activeCount: json['activeCount'] as int? ?? 0,
      interviewsCount: json['interviewsCount'] as int? ?? 0,
      offersCount: json['offersCount'] as int? ?? 0,
      hasSynced: json['hasSynced'] as bool? ?? false,
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
    required this.sync,
  });

  final String id;
  final String email;
  final String name;
  final String? picture;
  final String memberSince;
  final List<String> jobSources;
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
      sync: UserSyncState.fromJson(
        json['sync'] as Map<String, dynamic>? ?? {},
      ),
    );
  }
}
