export interface UserRecord {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbUserRow {
  id: string;
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
  created_at: string;
  updated_at: string;
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
