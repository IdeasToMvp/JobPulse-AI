import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';
const MAX_MESSAGES_PER_PLATFORM = 500;

export interface GmailTokens {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: Date;
}

export interface GmailMessageMeta {
  id: string;
  threadId: string;
  internalDate: Date;
  from: string;
  subject: string;
}

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('google.clientId') ?? '';
    this.clientSecret = this.config.get<string>('google.clientSecret') ?? '';
  }

  async listMessageIds(query: string, tokens: GmailTokens): Promise<string[]> {
    const client = this.createClient(tokens);
    const ids: string[] = [];
    let pageToken: string | undefined;

    do {
      const params = new URLSearchParams({
        q: query,
        maxResults: '100',
      });
      if (pageToken) params.set('pageToken', pageToken);

      const response = await this.request<GmailListResponse>(
        client,
        `${GMAIL_API}/messages?${params.toString()}`,
      );

      for (const message of response.messages ?? []) {
        ids.push(message.id);
        if (ids.length >= MAX_MESSAGES_PER_PLATFORM) return ids;
      }

      pageToken = response.nextPageToken;
    } while (pageToken);

    return ids;
  }

  async getMessageMetadata(
    messageId: string,
    tokens: GmailTokens,
  ): Promise<GmailMessageMeta | null> {
    const client = this.createClient(tokens);

    try {
      const message = await this.request<GmailMessageResponse>(
        client,
        `${GMAIL_API}/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      );

      const from =
        message.payload?.headers?.find(
          (h) => h.name?.toLowerCase() === 'from',
        )?.value ?? '';
      const subject =
        message.payload?.headers?.find(
          (h) => h.name?.toLowerCase() === 'subject',
        )?.value ?? '';

      return {
        id: message.id,
        threadId: message.threadId,
        internalDate: new Date(Number(message.internalDate)),
        from,
        subject,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch message ${messageId}: ${error}`);
      return null;
    }
  }

  private createClient(tokens: GmailTokens): OAuth2Client {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('Google OAuth is not configured');
    }
    if (!tokens.refreshToken && !tokens.accessToken) {
      throw new UnauthorizedException(
        'Gmail access not connected. Reconnect Gmail to sync.',
      );
    }

    const client = new OAuth2Client(this.clientId, this.clientSecret);
    client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expiry_date: tokens.accessTokenExpiresAt?.getTime(),
    });
    return client;
  }

  private async request<T>(client: OAuth2Client, url: string): Promise<T> {
    try {
      const response = await client.request<T>({ url });
      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Gmail API request failed';
      if (/invalid_grant|unauthorized|401|403/i.test(message)) {
        throw new UnauthorizedException(
          'Gmail access expired. Reconnect Gmail to continue syncing.',
        );
      }
      throw new BadRequestException(`Gmail scan failed: ${message}`);
    }
  }
}

interface GmailListResponse {
  messages?: { id: string }[];
  nextPageToken?: string;
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  internalDate: string;
  payload?: {
    headers?: { name?: string; value?: string }[];
  };
}
