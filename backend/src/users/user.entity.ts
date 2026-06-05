export interface UserRecord {
  id: string;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  refreshToken?: string;
  accessToken?: string;
  accessTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
