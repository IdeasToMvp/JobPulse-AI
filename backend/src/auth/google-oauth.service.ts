import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { randomBytes } from 'crypto';

import { SupabaseService } from '../supabase/supabase.service';
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

interface OAuthStateRow {
  state: string;
  redirect_uri: string;
  client_redirect_uri: string;
  expires_at: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);
  private readonly oauthClient: OAuth2Client;
  /** Fallback when oauth_states table is not migrated yet. */
  private readonly pendingStates = new Map<
    string,
    { redirectUri: string; clientRedirectUri: string; expiresAt: number }
  >();

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
  ) {
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

  async createAuthUrl(
    redirectUri?: string,
    clientRedirectUri?: string,
  ): Promise<{ authUrl: string; state: string }> {
    this.assertConfigured();

    const state = randomBytes(24).toString('hex');
    const resolvedRedirect =
      redirectUri ??
      this.config.get<string>('google.redirectUri') ??
      this.config.get<string>('mobileRedirectUri')!;
    const resolvedClientRedirect =
      clientRedirectUri ??
      this.config.get<string>('mobileRedirectUri') ??
      'jobpulse://auth/callback';
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const stored = await this.storeState({
      state,
      redirectUri: resolvedRedirect,
      clientRedirectUri: resolvedClientRedirect,
      expiresAt,
    });

    if (!stored) {
      this.pendingStates.set(state, {
        redirectUri: resolvedRedirect,
        clientRedirectUri: resolvedClientRedirect,
        expiresAt: expiresAt.getTime(),
      });
    }

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

  async consumeState(state: string, redirectUri: string): Promise<string> {
    const fromDb = await this.loadAndDeleteState(state);
    if (fromDb) {
      if (new Date(fromDb.expires_at) < new Date()) {
        throw new UnauthorizedException('Invalid or expired OAuth state');
      }
      if (fromDb.redirect_uri !== redirectUri) {
        throw new UnauthorizedException('Redirect URI mismatch');
      }
      return fromDb.client_redirect_uri;
    }

    const entry = this.pendingStates.get(state);
    this.pendingStates.delete(state);

    if (!entry || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    if (entry.redirectUri !== redirectUri) {
      throw new UnauthorizedException('Redirect URI mismatch');
    }

    return entry.clientRedirectUri;
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

  private async storeState(input: {
    state: string;
    redirectUri: string;
    clientRedirectUri: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const { error } = await this.supabase.db.from('oauth_states').insert({
      state: input.state,
      redirect_uri: input.redirectUri,
      client_redirect_uri: input.clientRedirectUri,
      expires_at: input.expiresAt.toISOString(),
    });

    if (error) {
      if (error.message?.includes('oauth_states')) {
        this.logger.warn(
          'oauth_states table missing; using in-memory OAuth state (not safe for multi-instance deploys)',
        );
        return false;
      }
      this.logger.error(`storeState failed: ${error.message}`);
      throw new BadRequestException('Could not start Google sign-in');
    }

    return true;
  }

  private async loadAndDeleteState(
    state: string,
  ): Promise<OAuthStateRow | null> {
    const { data, error } = await this.supabase.db
      .from('oauth_states')
      .select('state, redirect_uri, client_redirect_uri, expires_at')
      .eq('state', state)
      .maybeSingle();

    if (error) {
      if (error.message?.includes('oauth_states')) return null;
      this.logger.error(`loadState failed: ${error.message}`);
      return null;
    }

    if (!data) return null;

    await this.supabase.db.from('oauth_states').delete().eq('state', state);
    return data as OAuthStateRow;
  }
}
