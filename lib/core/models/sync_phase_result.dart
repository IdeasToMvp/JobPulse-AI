class PlatformSyncResult {
  const PlatformSyncResult({
    this.newMessages = 0,
    this.skippedProcessed = 0,
    this.aiCalls = 0,
    this.companiesDiscovered = 0,
    this.maxInternalDate,
    required this.fromDate,
    required this.toDate,
  });

  final int newMessages;
  final int skippedProcessed;
  final int aiCalls;
  final int companiesDiscovered;
  final String? maxInternalDate;
  final String fromDate;
  final String toDate;

  factory PlatformSyncResult.fromJson(Map<String, dynamic> json) {
    return PlatformSyncResult(
      newMessages: json['newMessages'] as int? ?? 0,
      skippedProcessed: json['skippedProcessed'] as int? ?? 0,
      aiCalls: json['aiCalls'] as int? ?? 0,
      companiesDiscovered: json['companiesDiscovered'] as int? ?? 0,
      maxInternalDate: json['maxInternalDate'] as String?,
      fromDate: json['fromDate'] as String? ?? '',
      toDate: json['toDate'] as String? ?? '',
    );
  }
}

class CompanySyncResult {
  const CompanySyncResult({
    this.companyEmailsProcessed = 0,
    this.skippedProcessed = 0,
    this.aiCalls = 0,
    this.companiesScanned = 0,
    required this.fromDate,
    required this.toDate,
  });

  final int companyEmailsProcessed;
  final int skippedProcessed;
  final int aiCalls;
  final int companiesScanned;
  final String fromDate;
  final String toDate;

  factory CompanySyncResult.fromJson(Map<String, dynamic> json) {
    return CompanySyncResult(
      companyEmailsProcessed: json['companyEmailsProcessed'] as int? ?? 0,
      skippedProcessed: json['skippedProcessed'] as int? ?? 0,
      aiCalls: json['aiCalls'] as int? ?? 0,
      companiesScanned: json['companiesScanned'] as int? ?? 0,
      fromDate: json['fromDate'] as String? ?? '',
      toDate: json['toDate'] as String? ?? '',
    );
  }
}
