import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { randomBytes } from 'crypto';

import { GMAIL_SCOPES } from './google-scopes';

export { GMAIL_SCOPES };

export interface GoogleTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  idToken?: string;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly oauthClient: OAuth2Client;
  private readonly pendingStates = new Map<
    string,
    { redirectUri: string; expiresAt: number }
  >();

  constructor(private readonly config: ConfigService) {
    this.oauthClient = new OAuth2Client(
      this.config.get<string>('google.clientId'),
      this.config.get<string>('google.clientSecret'),
      this.config.get<string>('google.redirectUri'),
    );
  }

  private assertConfigured(): void {
    const clientId = this.config.get<string>('google.clientId');
    const clientSecret = this.config.get<string>('google.clientSecret');
    if (!clientId || !clientSecret) {
      throw new BadRequestException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }
  }

  createAuthUrl(redirectUri?: string): { authUrl: string; state: string } {
    this.assertConfigured();

    const state = randomBytes(24).toString('hex');
    const resolvedRedirect =
      redirectUri ??
      this.config.get<string>('google.redirectUri') ??
      this.config.get<string>('mobileRedirectUri')!;

    this.pendingStates.set(state, {
      redirectUri: resolvedRedirect,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authUrl = this.oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GMAIL_SCOPES,
      state,
      redirect_uri: resolvedRedirect,
      include_granted_scopes: true,
    });

    return { authUrl, state };
  }

  consumeState(state: string, redirectUri: string): void {
    const entry = this.pendingStates.get(state);
    this.pendingStates.delete(state);

    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    if (entry.redirectUri !== redirectUri) {
      throw new UnauthorizedException('Redirect URI mismatch');
    }
  }

  async exchangeCode(
    code: string,
    redirectUri?: string,
  ): Promise<{ tokens: GoogleTokenResponse; profile: GoogleProfile }> {
    this.assertConfigured();

    const resolvedRedirect =
      redirectUri ?? this.config.get<string>('google.redirectUri')!;

    const client = new OAuth2Client(
      this.config.get<string>('google.clientId'),
      this.config.get<string>('google.clientSecret'),
      resolvedRedirect,
    );

    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) {
      throw new UnauthorizedException('Google did not return an access token');
    }

    const profile = await this.verifyIdToken(tokens.id_token);
    client.setCredentials(tokens);

    return {
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiryDate: tokens.expiry_date ?? undefined,
        idToken: tokens.id_token ?? undefined,
      },
      profile,
    };
  }

  async verifyIdToken(idToken?: string | null): Promise<GoogleProfile> {
    this.assertConfigured();
    if (!idToken) {
      throw new UnauthorizedException('Missing Google ID token');
    }

    const ticket = await this.oauthClient.verifyIdToken({
      idToken,
      audience: this.config.get<string>('google.clientId'),
    });

    const payload = ticket.getPayload() as TokenPayload | undefined;
    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google ID token payload');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email,
      picture: payload.picture,
    };
  }
}
