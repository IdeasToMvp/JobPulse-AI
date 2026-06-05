import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ApplicationStatus } from '../applications/application.entity';
import { ApplicationsService } from '../applications/applications.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ActivityListItem,
  ActivityListResponse,
  ActivityRecord,
  ActivityType,
  DbActivityRow,
  PLATFORM_LABELS,
  formatStatusLabel,
} from './activity.entity';
import { ActivityFilterType, filterToActivityType } from './dto/list-activities.dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly applications: ApplicationsService,
  ) {}

  async listActivities(
    userId: string,
    input: { type?: ActivityFilterType; offset?: number; limit?: number },
  ): Promise<ActivityListResponse> {
    await this.backfillIfEmpty(userId);

    const offset = input.offset ?? 0;
    const limit = input.limit ?? 20;
    const activityType = filterToActivityType(input.type);

    let query = this.supabase.db
      .from('activity_events')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activityType) {
      query = query.eq('type', activityType);
    }

    const { data, error, count } = await query;

    if (error) this.raise('listActivities', error);

    const total = count ?? 0;
    const items = (data as DbActivityRow[]).map((row) => this.toListItem(row));

    return {
      items,
      offset,
      limit,
      hasMore: offset + items.length < total,
    };
  }

  async recordApplicationDetected(input: {
    userId: string;
    applicationId: string;
    company: string;
    role?: string;
    platformId: string;
    occurredAt?: Date;
  }): Promise<void> {
    const platform = PLATFORM_LABELS[input.platformId] ?? input.platformId;
    await this.insertEvent({
      userId: input.userId,
      type: 'application',
      title: input.company,
      description: input.role
        ? `${input.role}\nDetected from ${platform}`
        : `Detected from ${platform}`,
      company: input.company,
      role: input.role,
      applicationId: input.applicationId,
      occurredAt: input.occurredAt,
      metadata: { platformId: input.platformId },
    });
  }

  async recordStatusUpdate(input: {
    userId: string;
    applicationId: string;
    company: string;
    role?: string;
    previousStatus: ApplicationStatus;
    newStatus: ApplicationStatus;
    platformId?: string;
    occurredAt?: Date;
  }): Promise<void> {
    if (input.previousStatus === input.newStatus) return;

    const from = formatStatusLabel(input.previousStatus);
    const to = formatStatusLabel(input.newStatus);

    await this.insertEvent({
      userId: input.userId,
      type: 'status_update',
      title: input.company,
      description: `${from} → ${to}`,
      company: input.company,
      role: input.role,
      applicationId: input.applicationId,
      occurredAt: input.occurredAt,
      metadata: {
        previousStatus: input.previousStatus,
        newStatus: input.newStatus,
        platformId: input.platformId,
      },
    });
  }

  async recordSuggestion(input: {
    userId: string;
    company: string;
    role?: string;
    suggestion: string;
    applicationId?: string;
    platformId?: string;
    occurredAt?: Date;
  }): Promise<void> {
    await this.insertEvent({
      userId: input.userId,
      type: 'suggestion',
      title: input.company,
      description: input.suggestion,
      company: input.company,
      role: input.role,
      applicationId: input.applicationId,
      occurredAt: input.occurredAt,
      metadata: { platformId: input.platformId },
    });
  }

  async recordSyncComplete(input: {
    userId: string;
    newMessages: number;
    newApplications: number;
    occurredAt?: Date;
  }): Promise<void> {
    const parts: string[] = ['Gmail synced successfully'];
    if (input.newApplications > 0) {
      parts.push(
        `${input.newApplications} new application${input.newApplications === 1 ? '' : 's'} found`,
      );
    } else if (input.newMessages > 0) {
      parts.push(`${input.newMessages} new email${input.newMessages === 1 ? '' : 's'} processed`);
    }

    await this.insertEvent({
      userId: input.userId,
      type: 'sync',
      title: 'Gmail Sync',
      description: parts.join('\n'),
      occurredAt: input.occurredAt,
      metadata: {
        newMessages: input.newMessages,
        newApplications: input.newApplications,
      },
    });
  }

  async clearUserActivities(userId: string): Promise<void> {
    const { error } = await this.supabase.db
      .from('activity_events')
      .delete()
      .eq('user_id', userId);

    if (error) this.raise('clearUserActivities', error);
  }

  private async backfillIfEmpty(userId: string): Promise<void> {
    const { count, error: countError } = await this.supabase.db
      .from('activity_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      if (countError.message?.includes('activity_events')) return;
      this.raise('backfillIfEmpty.count', countError);
    }

    if ((count ?? 0) > 0) return;

    const apps = await this.applications.listAllApplications(userId);
    const rows: Record<string, unknown>[] = [];

    for (const app of apps) {
      if (app.status === 'unknown') continue;

      const platform = PLATFORM_LABELS[app.platformId] ?? app.platformId;
      rows.push({
        user_id: userId,
        type: 'application',
        title: app.company,
        description: app.role
          ? `${app.role}\nDetected from ${platform}`
          : `Detected from ${platform}`,
        company: app.company,
        role: app.role ?? null,
        application_id: app.id,
        metadata: { platformId: app.platformId, backfill: true },
        occurred_at: app.createdAt.toISOString(),
      });

      const createdMs = app.createdAt.getTime();
      const updatedMs = app.updatedAt.getTime();
      if (updatedMs - createdMs > 60_000) {
        rows.push({
          user_id: userId,
          type: 'status_update',
          title: app.company,
          description: `Updated to ${formatStatusLabel(app.status)}`,
          company: app.company,
          role: app.role ?? null,
          application_id: app.id,
          metadata: {
            newStatus: app.status,
            platformId: app.platformId,
            backfill: true,
          },
          occurred_at: app.updatedAt.toISOString(),
        });
      }
    }

    const { data: userRow } = await this.supabase.db
      .from('users')
      .select('last_synced_at, applications_count')
      .eq('id', userId)
      .maybeSingle();

    if (userRow?.last_synced_at) {
      rows.push({
        user_id: userId,
        type: 'sync',
        title: 'Gmail Sync',
        description: 'Gmail synced successfully',
        metadata: { backfill: true },
        occurred_at: userRow.last_synced_at as string,
      });
    }

    if (rows.length === 0) return;

    const { error: insertError } = await this.supabase.db
      .from('activity_events')
      .insert(rows);

    if (insertError) this.raise('backfillIfEmpty.insert', insertError);
  }

  private async insertEvent(input: {
    userId: string;
    type: ActivityType;
    title: string;
    description: string;
    company?: string;
    role?: string;
    applicationId?: string;
    metadata?: Record<string, unknown>;
    occurredAt?: Date;
  }): Promise<ActivityRecord> {
    const { data, error } = await this.supabase.db
      .from('activity_events')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        company: input.company ?? null,
        role: input.role ?? null,
        application_id: input.applicationId ?? null,
        metadata: input.metadata ?? {},
        occurred_at: (input.occurredAt ?? new Date()).toISOString(),
      })
      .select('*')
      .single();

    if (error) this.raise('insertEvent', error);
    return this.mapRow(data as DbActivityRow);
  }

  private toListItem(row: DbActivityRow): ActivityListItem {
    return {
      id: row.id,
      type: row.type as ActivityType,
      title: row.title,
      description: row.description,
      company: row.company ?? undefined,
      role: row.role ?? undefined,
      applicationId: row.application_id ?? undefined,
      timestamp: row.occurred_at,
      metadata: row.metadata ?? {},
    };
  }

  private mapRow(row: DbActivityRow): ActivityRecord {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as ActivityType,
      title: row.title,
      description: row.description,
      company: row.company ?? undefined,
      role: row.role ?? undefined,
      applicationId: row.application_id ?? undefined,
      metadata: row.metadata ?? {},
      occurredAt: new Date(row.occurred_at),
      createdAt: new Date(row.created_at),
    };
  }

  private raise(operation: string, error: { message: string }): never {
    this.logger.error(`${operation} failed: ${error.message}`);
    throw new InternalServerErrorException('Database operation failed');
  }
}
