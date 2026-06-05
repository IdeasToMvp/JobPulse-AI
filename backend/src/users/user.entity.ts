export interface UserRecord {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncedAt?: Date;
  emailsProcessed: number;
  applicationsCount: number;
  activeCount: number;
  interviewsCount: number;
  offersCount: number;
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
  emails_processed: number;
  applications_count: number;
  active_count: number;
  interviews_count: number;
  offers_count: number;
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
  sync: {
    lastSyncedAt: string | null;
    emailsProcessed: number;
    applicationsCount: number;
    activeCount: number;
    interviewsCount: number;
    offersCount: number;
    hasSynced: boolean;
  };
}
