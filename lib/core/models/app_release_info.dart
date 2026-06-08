class AppReleaseInfo {
  const AppReleaseInfo({
    required this.updateAvailable,
    required this.latestVersion,
    required this.latestBuildNumber,
    required this.apkUrl,
    required this.releaseNotes,
    required this.forceUpdate,
    required this.minSupportedBuildNumber,
  });

  final bool updateAvailable;
  final String latestVersion;
  final int latestBuildNumber;
  final String? apkUrl;
  final String releaseNotes;
  final bool forceUpdate;
  final int minSupportedBuildNumber;

  factory AppReleaseInfo.fromJson(Map<String, dynamic> json) {
    return AppReleaseInfo(
      updateAvailable: json['updateAvailable'] as bool? ?? false,
      latestVersion: (json['latestVersion'] as String?) ?? '1.0.0',
      latestBuildNumber: (json['latestBuildNumber'] as num?)?.toInt() ?? 1,
      apkUrl: json['apkUrl'] as String?,
      releaseNotes: (json['releaseNotes'] as String?) ?? '',
      forceUpdate: json['forceUpdate'] as bool? ?? false,
      minSupportedBuildNumber:
          (json['minSupportedBuildNumber'] as num?)?.toInt() ?? 1,
    );
  }
}
