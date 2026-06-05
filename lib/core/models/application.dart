class ApplicationExtractedDetails {
  const ApplicationExtractedDetails({
    this.company,
    this.role,
    this.salary,
    this.location,
    this.employmentType,
    required this.source,
    this.confidence,
  });

  final String? company;
  final String? role;
  final String? salary;
  final String? location;
  final String? employmentType;
  final String source;
  final double? confidence;

  factory ApplicationExtractedDetails.fromJson(Map<String, dynamic> json) {
    return ApplicationExtractedDetails(
      company: json['company'] as String?,
      role: json['role'] as String?,
      salary: json['salary'] as String?,
      location: json['location'] as String?,
      employmentType: json['employmentType'] as String?,
      source: json['source'] as String? ?? 'rule',
      confidence: (json['confidence'] as num?)?.toDouble(),
    );
  }
}

class CompanyApplicationSummary {
  const CompanyApplicationSummary({
    required this.id,
    this.role,
    required this.status,
    required this.appliedAt,
  });

  final String id;
  final String? role;
  final String status;
  final DateTime appliedAt;

  factory CompanyApplicationSummary.fromJson(Map<String, dynamic> json) {
    return CompanyApplicationSummary(
      id: json['id'] as String,
      role: json['role'] as String?,
      status: json['status'] as String,
      appliedAt: DateTime.parse(json['appliedAt'] as String),
    );
  }
}

class StatusHistoryEntry {
  const StatusHistoryEntry({
    required this.status,
    required this.changedAt,
    required this.source,
  });

  final String status;
  final DateTime changedAt;
  final String source;

  factory StatusHistoryEntry.fromJson(Map<String, dynamic> json) {
    return StatusHistoryEntry(
      status: json['status'] as String,
      changedAt: DateTime.parse(json['changedAt'] as String),
      source: json['source'] as String? ?? 'sync',
    );
  }
}

class JobApplication {
  const JobApplication({
    required this.id,
    required this.company,
    this.role,
    required this.status,
    required this.platformId,
    required this.appliedAt,
    this.lastMessageAt,
    required this.updatedAt,
    this.extractedDetails,
    this.companyApplyCount,
    this.companyRoles,
  });

  final String id;
  final String company;
  final String? role;
  final String status;
  final String platformId;
  final DateTime appliedAt;
  final DateTime? lastMessageAt;
  final DateTime updatedAt;
  final ApplicationExtractedDetails? extractedDetails;
  final int? companyApplyCount;
  final List<String>? companyRoles;

  JobApplication copyWith({
    String? status,
    DateTime? updatedAt,
    ApplicationExtractedDetails? extractedDetails,
    int? companyApplyCount,
    List<String>? companyRoles,
  }) {
    return JobApplication(
      id: id,
      company: company,
      role: role,
      status: status ?? this.status,
      platformId: platformId,
      appliedAt: appliedAt,
      lastMessageAt: lastMessageAt,
      updatedAt: updatedAt ?? this.updatedAt,
      extractedDetails: extractedDetails ?? this.extractedDetails,
      companyApplyCount: companyApplyCount ?? this.companyApplyCount,
      companyRoles: companyRoles ?? this.companyRoles,
    );
  }

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    final appliedRaw = json['appliedAt'] as String?;
    final lastMessageRaw = json['lastMessageAt'] as String?;
    final updatedRaw = json['updatedAt'] as String?;
    final extractedRaw = json['extractedDetails'] as Map<String, dynamic>?;
    final rolesRaw = json['companyRoles'] as List<dynamic>?;

    return JobApplication(
      id: json['id'] as String,
      company: json['company'] as String,
      role: json['role'] as String?,
      status: json['status'] as String,
      platformId: json['platformId'] as String,
      appliedAt: appliedRaw != null
          ? DateTime.parse(appliedRaw)
          : (updatedRaw != null
              ? DateTime.parse(updatedRaw)
              : DateTime.now()),
      lastMessageAt:
          lastMessageRaw != null ? DateTime.tryParse(lastMessageRaw) : null,
      updatedAt: updatedRaw != null
          ? DateTime.parse(updatedRaw)
          : DateTime.now(),
      extractedDetails: extractedRaw != null
          ? ApplicationExtractedDetails.fromJson(extractedRaw)
          : null,
      companyApplyCount: json['companyApplyCount'] as int?,
      companyRoles: rolesRaw?.map((e) => e as String).toList(),
    );
  }
}

class ApplicationDetail extends JobApplication {
  const ApplicationDetail({
    required super.id,
    required super.company,
    super.role,
    required super.status,
    required super.platformId,
    required super.appliedAt,
    super.lastMessageAt,
    required super.updatedAt,
    super.extractedDetails,
    super.companyApplyCount,
    super.companyRoles,
    required this.statusHistory,
    this.companyApplications,
  });

  final List<StatusHistoryEntry> statusHistory;
  final List<CompanyApplicationSummary>? companyApplications;

  factory ApplicationDetail.fromJson(Map<String, dynamic> json) {
    final base = JobApplication.fromJson(json);
    final historyRaw = json['statusHistory'] as List<dynamic>? ?? [];
    final siblingsRaw = json['companyApplications'] as List<dynamic>?;

    return ApplicationDetail(
      id: base.id,
      company: base.company,
      role: base.role,
      status: base.status,
      platformId: base.platformId,
      appliedAt: base.appliedAt,
      lastMessageAt: base.lastMessageAt,
      updatedAt: base.updatedAt,
      extractedDetails: base.extractedDetails,
      companyApplyCount: base.companyApplyCount,
      companyRoles: base.companyRoles,
      statusHistory: historyRaw
          .map((e) => StatusHistoryEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      companyApplications: siblingsRaw
          ?.map(
            (e) =>
                CompanyApplicationSummary.fromJson(e as Map<String, dynamic>),
          )
          .toList(),
    );
  }
}

class UpdateApplicationStatusResult {
  const UpdateApplicationStatusResult({
    required this.application,
    required this.sync,
  });

  final ApplicationDetail application;
  final Map<String, dynamic> sync;

  factory UpdateApplicationStatusResult.fromJson(Map<String, dynamic> json) {
    return UpdateApplicationStatusResult(
      application: ApplicationDetail.fromJson(
        json['application'] as Map<String, dynamic>,
      ),
      sync: json['sync'] as Map<String, dynamic>? ?? {},
    );
  }
}
