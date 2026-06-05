import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GoogleOAuthService } from './google-oauth.service';
import { UserRecord } from '../users/user.entity';

export interface AuthTokensResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly googleOAuth: GoogleOAuthService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  getGoogleAuthUrl(redirectUri?: string) {
    return this.googleOAuth.createAuthUrl(redirectUri);
  }

  async loginWithGoogleCode(
    code: string,
    redirectUri?: string,
    state?: string,
  ): Promise<AuthTokensResponse> {
    if (state && redirectUri) {
      this.googleOAuth.consumeState(state, redirectUri);
    }

    const { tokens, profile } = await this.googleOAuth.exchangeCode(
      code,
      redirectUri,
    );

    const user = this.users.upsertGoogleUser({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.expiryDate
        ? new Date(tokens.expiryDate)
        : undefined,
    });

    return this.issueSession(user);
  }

  async loginWithGoogleIdToken(idToken: string): Promise<AuthTokensResponse> {
    const profile = await this.googleOAuth.verifyIdToken(idToken);
    const user = this.users.upsertGoogleUser({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    return this.issueSession(user);
  }

  async getProfile(userId: string) {
    const user = this.users.findById(userId);
    if (!user) return null;
    return this.toPublicUser(user);
  }

  async logout(userId: string): Promise<void> {
    this.users.clearRefreshToken(userId);
  }

  private issueSession(user: UserRecord): AuthTokensResponse {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwt.expiresIn') ?? '7d',
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: UserRecord) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
  }
}
