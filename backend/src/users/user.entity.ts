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
}

export type InitialSyncMode = 'new_only' | 'import_history';

export interface UserRecord {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  lastGmailInternalDate?: Date;
  syncFromDate?: Date;
  syncToDate?: Date;
  emailsProcessed: number;
  applicationsCount: number;
  appliedCount: number;
  activeCount: number;
  interviewsCount: number;
  offersCount: number;
  rejectedCount: number;
  ghostedCount: number;
  autoSyncEnabled: boolean;
  syncFrequencyMinutes: number;
  initialSyncMode?: InitialSyncMode;
}

export interface DbUserRow {
  id: string;
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
  last_gmail_internal_date: string | null;
  sync_from_date: string | null;
  sync_to_date: string | null;
  emails_processed: number;
  applications_count: number;
  applied_count: number;
  active_count: number;
  interviews_count: number;
  offers_count: number;
  rejected_count: number;
  ghosted_count: number;
  auto_sync_enabled: boolean;
  sync_frequency_minutes: number;
  initial_sync_mode: string | null;
}

export interface DbOAuthRow {
  id: string;
  user_id: string;
  provider: string;
  refresh_token_encrypted: string | null;
  access_token_encrypted: string | null;
  access_token_expires_at: string | null;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
  memberSince: string;
  jobSources: string[];
  syncSettings: {
    autoSyncEnabled: boolean;
    syncFrequencyMinutes: number;
    initialSyncMode: InitialSyncMode | null;
  };
  sync: {
    lastSyncedAt: string | null;
    emailsProcessed: number;
    applicationsCount: number;
    appliedCount: number;
    activeCount: number;
    interviewsCount: number;
    offersCount: number;
    rejectedCount: number;
    ghostedCount: number;
    hasSynced: boolean;
    scan?: SyncScanMeta;
    byPlatform?: Record<string, PlatformSyncStats>;
  };
}

export interface GoogleTokens {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
}
