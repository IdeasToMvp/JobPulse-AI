export type ActivityType =
  | 'application'
  | 'status_update'
  | 'suggestion'
  | 'sync'
  | 'user_action';

export interface ActivityRecord {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description: string;
  company?: string;
  role?: string;
  applicationId?: string;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  createdAt: Date;
}

export interface ActivityListItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  company?: string;
  role?: string;
  applicationId?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ActivityListResponse {
  items: ActivityListItem[];
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface DbActivityRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  company: string | null;
  role: string | null;
  application_id: string | null;
  metadata: Record<string, unknown> | null;
  occurred_at: string;
  created_at: string;
}

export const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  naukri: 'Naukri',
  indeed: 'Indeed',
  instahyre: 'Instahyre',
  wellfound: 'Wellfound',
  foundit: 'Foundit',
  glassdoor: 'Glassdoor',
  career_pages: 'Career Pages',
  referrals: 'Referrals',
  company_direct: 'Company email',
};

export function formatStatusLabel(status: string): string {
  if (!status) return status;
  return status.charAt(0).toUpperCase() + status.slice(1);
}
