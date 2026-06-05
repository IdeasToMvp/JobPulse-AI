import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GMAIL_SCOPES } from '../auth/google-scopes';
import { TokenEncryptionService } from '../common/crypto/token-encryption.service';
import { SupabaseService } from '../supabase/supabase.service';
import { DbOAuthRow, DbUserRow, UserRecord } from './user.entity';

export interface UpsertGoogleUserInput {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  refreshToken?: string;
  accessToken?: string;
  accessTokenExpiresAt?: Date;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly encryption: TokenEncryptionService,
  ) {}

  async findById(id: string): Promise<UserRecord | null> {
    const { data, error } = await this.supabase.db
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) this.raiseDbError('findById', error);
    return data ? this.mapUser(data as DbUserRow) : null;
  }

  async findByGoogleId(googleId: string): Promise<UserRecord | null> {
    const { data, error } = await this.supabase.db
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .maybeSingle();

    if (error) this.raiseDbError('findByGoogleId', error);
    return data ? this.mapUser(data as DbUserRow) : null;
  }

  async upsertGoogleUser(input: UpsertGoogleUserInput): Promise<UserRecord> {
    const existing = await this.findByGoogleId(input.googleId);
    const user = existing
      ? await this.updateUser(existing.id, input)
      : await this.insertUser(input);

    await this.upsertOAuthCredentials(user.id, input);
    return user;
  }

  async clearOAuthCredentials(userId: string): Promise<void> {
    const { error } = await this.supabase.db
      .from('oauth_credentials')
      .delete()
      .eq('user_id', userId);

    if (error) this.raiseDbError('clearOAuthCredentials', error);
  }

  private async insertUser(input: UpsertGoogleUserInput): Promise<UserRecord> {
    const { data, error } = await this.supabase.db
      .from('users')
      .insert({
        google_id: input.googleId,
        email: input.email,
        name: input.name,
        picture: input.picture ?? null,
      })
      .select('*')
      .single();

    if (error) this.raiseDbError('insertUser', error);
    return this.mapUser(data as DbUserRow);
  }

  private async updateUser(
    id: string,
    input: UpsertGoogleUserInput,
  ): Promise<UserRecord> {
    const { data, error } = await this.supabase.db
      .from('users')
      .update({
        email: input.email,
        name: input.name,
        picture: input.picture ?? null,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) this.raiseDbError('updateUser', error);
    return this.mapUser(data as DbUserRow);
  }

  private async upsertOAuthCredentials(
    userId: string,
    input: UpsertGoogleUserInput,
  ): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase.db
      .from('oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) this.raiseDbError('fetchOAuthCredentials', fetchError);

    const payload: Record<string, unknown> = {
      user_id: userId,
      provider: 'google',
      scopes: [...GMAIL_SCOPES],
    };

    if (input.accessToken) {
      payload.access_token_encrypted = this.encryption.encrypt(
        input.accessToken,
      );
      payload.access_token_expires_at =
        input.accessTokenExpiresAt?.toISOString() ?? null;
    }

    if (input.refreshToken) {
      payload.refresh_token_encrypted = this.encryption.encrypt(
        input.refreshToken,
      );
    } else if (existing) {
      payload.refresh_token_encrypted = (
        existing as DbOAuthRow
      ).refresh_token_encrypted;
    }

    if (!existing && !input.refreshToken && !input.accessToken) {
      return;
    }

    const { error } = await this.supabase.db
      .from('oauth_credentials')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) this.raiseDbError('upsertOAuthCredentials', error);
  }

  private mapUser(row: DbUserRow): UserRecord {
    return {
      id: row.id,
      googleId: row.google_id,
      email: row.email,
      name: row.name,
      picture: row.picture ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private raiseDbError(operation: string, error: { message: string }): never {
    this.logger.error(`${operation} failed: ${error.message}`);
    throw new InternalServerErrorException('Database operation failed');
  }
}
