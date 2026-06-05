export type ApplicationStatus =
  | 'applied'
  | 'active'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'unknown';

export type ClassificationSource = 'rule' | 'ai' | 'none';

export type ExtractedDetailsSource = 'rule' | 'ai' | 'mixed';

export interface ApplicationExtractedDetails {
  company?: string;
  role?: string;
  salary?: string;
  location?: string;
  employmentType?: string;
  source: ExtractedDetailsSource;
  confidence?: number;
}

export interface CompanyApplicationSummary {
  id: string;
  role?: string;
  status: ApplicationStatus;
  appliedAt: string;
}

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
  extractedDetails?: ApplicationExtractedDetails;
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
  appliedCount: number;
  activeCount: number;
  interviewsCount: number;
  offersCount: number;
  rejectedCount: number;
  ghostedCount: number;
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
  extractedDetails?: ApplicationExtractedDetails;
  companyApplyCount?: number;
  companyRoles?: string[];
}

export type StatusHistorySource = 'sync' | 'user';

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changedAt: string;
  source: StatusHistorySource;
}

export interface ApplicationDetailResponse extends ApplicationListItem {
  statusHistory: StatusHistoryEntry[];
  companyApplications?: CompanyApplicationSummary[];
}

export interface UpdateApplicationStatusResponse {
  application: ApplicationDetailResponse;
  sync: {
    lastSyncedAt: string | null;
    emailsProcessed: number;
    applicationsCount: number;
    activeCount: number;
    appliedCount: number;
    interviewsCount: number;
    offersCount: number;
    rejectedCount: number;
    ghostedCount: number;
    hasSynced: boolean;
  };
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
  extracted_details: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DbStatusHistoryRow {
  id: string;
  user_id: string;
  application_id: string;
  status: string;
  changed_at: string;
  source: string;
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
