import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserRecord } from './user.entity';

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
  private readonly users = new Map<string, UserRecord>();
  private readonly byGoogleId = new Map<string, string>();
  private readonly byEmail = new Map<string, string>();

  findById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  findByGoogleId(googleId: string): UserRecord | undefined {
    const id = this.byGoogleId.get(googleId);
    return id ? this.users.get(id) : undefined;
  }

  upsertGoogleUser(input: UpsertGoogleUserInput): UserRecord {
    const existingId = this.byGoogleId.get(input.googleId);
    const now = new Date();

    if (existingId) {
      const existing = this.users.get(existingId)!;
      const updated: UserRecord = {
        ...existing,
        email: input.email,
        name: input.name,
        picture: input.picture ?? existing.picture,
        refreshToken: input.refreshToken ?? existing.refreshToken,
        accessToken: input.accessToken ?? existing.accessToken,
        accessTokenExpiresAt:
          input.accessTokenExpiresAt ?? existing.accessTokenExpiresAt,
        updatedAt: now,
      };
      this.users.set(existingId, updated);
      this.byEmail.set(input.email, existingId);
      return updated;
    }

    const id = randomUUID();
    const created: UserRecord = {
      id,
      googleId: input.googleId,
      email: input.email,
      name: input.name,
      picture: input.picture,
      refreshToken: input.refreshToken,
      accessToken: input.accessToken,
      accessTokenExpiresAt: input.accessTokenExpiresAt,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, created);
    this.byGoogleId.set(input.googleId, id);
    this.byEmail.set(input.email, id);
    return created;
  }

  clearRefreshToken(userId: string): void {
    const user = this.users.get(userId);
    if (!user) return;
    this.users.set(userId, {
      ...user,
      refreshToken: undefined,
      accessToken: undefined,
      accessTokenExpiresAt: undefined,
      updatedAt: new Date(),
    });
  }
}
