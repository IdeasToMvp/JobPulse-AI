enum ActivityType {
  application,
  statusUpdate,
  suggestion,
  sync,
  userAction,
}

extension ActivityTypeJson on ActivityType {
  static ActivityType fromJson(String value) {
    switch (value) {
      case 'status_update':
        return ActivityType.statusUpdate;
      case 'user_action':
        return ActivityType.userAction;
      case 'suggestion':
        return ActivityType.suggestion;
      case 'sync':
        return ActivityType.sync;
      case 'application':
      default:
        return ActivityType.application;
    }
  }

  String get apiValue {
    switch (this) {
      case ActivityType.statusUpdate:
        return 'status_update';
      case ActivityType.userAction:
        return 'user_action';
      case ActivityType.suggestion:
        return 'suggestion';
      case ActivityType.sync:
        return 'sync';
      case ActivityType.application:
        return 'application';
    }
  }
}

class ActivityItem {
  const ActivityItem({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.timestamp,
    this.company,
    this.role,
    this.applicationId,
    this.metadata = const {},
  });

  final String id;
  final ActivityType type;
  final String title;
  final String description;
  final DateTime timestamp;
  final String? company;
  final String? role;
  final String? applicationId;
  final Map<String, dynamic> metadata;

  factory ActivityItem.fromJson(Map<String, dynamic> json) {
    return ActivityItem(
      id: json['id'] as String,
      type: ActivityTypeJson.fromJson(json['type'] as String? ?? 'application'),
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      timestamp: DateTime.parse(json['timestamp'] as String),
      company: json['company'] as String?,
      role: json['role'] as String?,
      applicationId: json['applicationId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
    );
  }
}

class ActivityPage {
  const ActivityPage({
    required this.items,
    required this.offset,
    required this.limit,
    required this.hasMore,
  });

  final List<ActivityItem> items;
  final int offset;
  final int limit;
  final bool hasMore;

  factory ActivityPage.fromJson(Map<String, dynamic> json) {
    final itemsRaw = json['items'] as List<dynamic>? ?? [];
    return ActivityPage(
      items: itemsRaw
          .map((e) => ActivityItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      offset: json['offset'] as int? ?? 0,
      limit: json['limit'] as int? ?? 20,
      hasMore: json['hasMore'] as bool? ?? false,
    );
  }
}

enum ActivityFilter {
  all('all', 'All'),
  application('application', 'Applications'),
  statusUpdate('status_update', 'Status Updates'),
  suggestion('suggestion', 'Suggestions'),
  sync('sync', 'Syncs');

  const ActivityFilter(this.apiValue, this.label);
  final String apiValue;
  final String label;
}
