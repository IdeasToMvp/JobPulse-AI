import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { GoogleOAuthService } from './google-oauth.service';
import { UserProfileResponse, UserRecord } from '../users/user.entity';

export interface AuthTokensResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: UserProfileResponse;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly googleOAuth: GoogleOAuthService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  getGoogleAuthUrl(redirectUri?: string, clientRedirectUri?: string) {
    return this.googleOAuth.createAuthUrl(redirectUri, clientRedirectUri);
  }

  async loginWithGoogleCode(
    code: string,
    redirectUri?: string,
    state?: string,
  ): Promise<{ session: AuthTokensResponse; clientRedirectUri: string }> {
    const defaultClientRedirect =
      this.config.get<string>('mobileRedirectUri') ??
      'jobpulse://auth/callback';

    let clientRedirectUri = defaultClientRedirect;
    if (state && redirectUri) {
      clientRedirectUri = await this.googleOAuth.consumeState(
        state,
        redirectUri,
      );
    }

    const { tokens, profile: googleProfile } =
      await this.googleOAuth.exchangeCode(code, redirectUri);

    const user = await this.users.upsertGoogleUser({
      googleId: googleProfile.googleId,
      email: googleProfile.email,
      name: googleProfile.name,
      picture: googleProfile.picture,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      accessTokenExpiresAt: tokens.expiryDate
        ? new Date(tokens.expiryDate)
        : undefined,
    });

    const userProfile = await this.users.getProfile(user.id);
    return {
      session: this.issueSession(user, userProfile),
      clientRedirectUri,
    };
  }

  async loginWithGoogleIdToken(idToken: string): Promise<AuthTokensResponse> {
    const googleProfile = await this.googleOAuth.verifyIdToken(idToken);
    const user = await this.users.upsertGoogleUser({
      googleId: googleProfile.googleId,
      email: googleProfile.email,
      name: googleProfile.name,
      picture: googleProfile.picture,
    });

    const userProfile = await this.users.getProfile(user.id);
    return this.issueSession(user, userProfile);
  }

  async getProfile(userId: string) {
    return this.users.getProfile(userId);
  }

  async logout(userId: string): Promise<void> {
    await this.users.clearOAuthCredentials(userId);
  }

  private issueSession(
    user: UserRecord,
    profile: Awaited<ReturnType<UsersService['getProfile']>>,
  ): AuthTokensResponse {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.config.get<string>('jwt.expiresIn') ?? '7d',
      user: profile ?? this.users.toProfile(user, []),
    };
  }
}
