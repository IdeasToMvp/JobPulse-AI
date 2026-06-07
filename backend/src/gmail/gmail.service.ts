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

export interface GmailMessageContent {
  plainText?: string;
  html?: string;
  htmlAsText?: string;
  mimeTypes: string[];
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

  async getMessagePlainText(
    messageId: string,
    tokens: GmailTokens,
  ): Promise<string | null> {
    const content = await this.getMessageContent(messageId, tokens);
    return content?.plainText ?? content?.htmlAsText ?? null;
  }

  async getMessageContent(
    messageId: string,
    tokens: GmailTokens,
  ): Promise<GmailMessageContent | null> {
    const client = this.createClient(tokens);

    try {
      const message = await this.request<GmailMessageResponse>(
        client,
        `${GMAIL_API}/messages/${messageId}?format=full`,
      );

      const { plainText, html } = extractBodiesFromPayload(message.payload);
      const htmlAsText = html ? htmlToStructuredText(html) : '';

      return {
        plainText: plainText || undefined,
        html: html || undefined,
        htmlAsText: htmlAsText || undefined,
        mimeTypes: collectMimeTypes(message.payload),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch message body ${messageId}: ${error}`,
      );
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

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function stripHtml(html: string): string {
  return htmlToStructuredText(html);
}

export function htmlToStructuredText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\t+/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function extractBodiesFromPayload(
  payload: GmailMessagePayload | undefined,
): { plainText: string; html: string } {
  const plainParts: string[] = [];
  const htmlParts: string[] = [];

  function walk(part: GmailMessagePayload | undefined): void {
    if (!part) return;

    if (part.body?.data) {
      const decoded = decodeBase64Url(part.body.data);
      if (part.mimeType === 'text/html') {
        htmlParts.push(decoded);
      } else {
        plainParts.push(decoded);
      }
      return;
    }

    for (const nested of part.parts ?? []) {
      walk(nested);
    }
  }

  walk(payload);

  return {
    plainText: plainParts.join('\n').trim(),
    html: htmlParts.join('\n').trim(),
  };
}

function collectMimeTypes(payload: GmailMessagePayload | undefined): string[] {
  const types = new Set<string>();

  function walk(part: GmailMessagePayload | undefined): void {
    if (!part) return;
    if (part.mimeType) types.add(part.mimeType);
    for (const nested of part.parts ?? []) {
      walk(nested);
    }
  }

  walk(payload);
  return [...types];
}

function extractPlainTextFromPayload(
  payload: GmailMessagePayload | undefined,
): string {
  const { plainText, html } = extractBodiesFromPayload(payload);
  if (plainText) return plainText;
  if (html) return htmlToStructuredText(html);
  return '';
}

interface GmailListResponse {
  messages?: { id: string }[];
  nextPageToken?: string;
}

interface GmailMessageResponse {
  id: string;
  threadId: string;
  internalDate: string;
  payload?: GmailMessagePayload;
}

interface GmailMessagePayload {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePayload[];
  headers?: { name?: string; value?: string }[];
}
