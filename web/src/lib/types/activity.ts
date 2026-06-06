export type ActivityType =
  | "application"
  | "status_update"
  | "suggestion"
  | "sync"
  | "user_action";

export type ActivityFilterId =
  | "all"
  | "application"
  | "status_update"
  | "suggestion"
  | "sync";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  company?: string;
  role?: string;
  applicationId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActivityPage {
  items: ActivityItem[];
  offset: number;
  limit: number;
  hasMore: boolean;
}
