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
  });

  final String id;
  final String company;
  final String? role;
  final String status;
  final String platformId;
  final DateTime appliedAt;
  final DateTime? lastMessageAt;
  final DateTime updatedAt;

  factory JobApplication.fromJson(Map<String, dynamic> json) {
    final appliedRaw = json['appliedAt'] as String?;
    final lastMessageRaw = json['lastMessageAt'] as String?;
    final updatedRaw = json['updatedAt'] as String?;
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
    );
  }
}
