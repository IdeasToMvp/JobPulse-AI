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
  newApplications: number;
  skippedProcessed: number;
  aiCalls: number;
  companiesDiscovered: number;
  companyEmailsProcessed: number;
  companiesScanned: number;
}

export interface UserSyncSettings {
  autoSyncEnabled: boolean;
  syncFrequencyMinutes: number;
  initialSyncMode?: string;
}

export interface UserSyncState {
  lastSyncedAt?: string;
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
  byPlatform: Record<string, PlatformSyncStats>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  memberSince: string;
  jobSources: string[];
  syncSettings: UserSyncSettings;
  sync: UserSyncState;
}

export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  user: UserProfile;
}
