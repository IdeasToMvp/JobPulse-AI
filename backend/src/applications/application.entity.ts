export type ApplicationStatus =
  | 'applied'
  | 'active'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'unknown';

export type ClassificationSource = 'rule' | 'ai' | 'none';

export interface ApplicationRecord {
  id: string;
  userId: string;
  threadId: string;
  cycleIndex: number;
  platformId: string;
  company: string;
  companyId?: string;
  role?: string;
  status: ApplicationStatus;
  lastMessageId?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessedEmailRecord {
  id: string;
  userId: string;
  messageId: string;
  threadId: string;
  platformId: string;
  subject?: string;
  fromAddress?: string;
  internalDate: Date;
  classificationStatus: ApplicationStatus | 'unknown';
  classificationSource?: ClassificationSource;
  applicationId?: string;
  processedAt: Date;
}

export interface PlatformSyncStats {
  emailsProcessed: number;
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
}

export interface SyncScanMeta {
  fromDate: string;
  toDate: string;
  newMessages: number;
  skippedProcessed: number;
  aiCalls: number;
  companiesDiscovered?: number;
  companyEmailsProcessed?: number;
  companiesScanned?: number;
}

export interface SyncResultResponse {
  lastSyncedAt: string;
  emailsProcessed: number;
  applicationsCount: number;
  activeCount: number;
  interviewsCount: number;
  offersCount: number;
  hasSynced: boolean;
  scan: SyncScanMeta;
  byPlatform: Record<string, PlatformSyncStats>;
}

export interface ApplicationListItem {
  id: string;
  company: string;
  role?: string;
  status: ApplicationStatus;
  platformId: string;
  appliedAt: string;
  lastMessageAt?: string;
  updatedAt: string;
}

export interface DbApplicationRow {
  id: string;
  user_id: string;
  thread_id: string;
  cycle_index: number;
  platform_id: string;
  company: string;
  company_id: string | null;
  role: string | null;
  status: string;
  last_message_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbProcessedEmailRow {
  id: string;
  user_id: string;
  message_id: string;
  thread_id: string;
  platform_id: string;
  sync_phase: string;
  subject: string | null;
  from_address: string | null;
  internal_date: string;
  classification_status: string;
  classification_source: string | null;
  application_id: string | null;
  processed_at: string;
}
