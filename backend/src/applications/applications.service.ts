import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ApplicationListItem,
  ApplicationRecord,
  ApplicationStatus,
  ClassificationSource,
  DbApplicationRow,
  PlatformSyncStats,
  ProcessedEmailRecord,
  SyncResultResponse,
} from './application.entity';
import { normalizeCompanyKey, rolesOverlap } from '../sync/company-name.util';
import { formatIsoDate } from '../sync/platform-filters';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async isMessageProcessed(
    userId: string,
    messageId: string,
  ): Promise<boolean> {
    const { data, error } = await this.supabase.db
      .from('processed_emails')
      .select('id')
      .eq('user_id', userId)
      .eq('message_id', messageId)
      .maybeSingle();

    if (error) this.raise('isMessageProcessed', error);
    return !!data;
  }

  async getLatestApplicationForThread(
    userId: string,
    threadId: string,
  ): Promise<ApplicationRecord | null> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('thread_id', threadId)
      .order('cycle_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) this.raise('getLatestApplicationForThread', error);
    return data ? this.mapApplication(data as DbApplicationRow) : null;
  }

  async getLatestApplicationForCompany(
    userId: string,
    companyId: string,
  ): Promise<ApplicationRecord | null> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) this.raise('getLatestApplicationForCompany', error);
    return data ? this.mapApplication(data as DbApplicationRow) : null;
  }

  async getLatestApplicationForCompanyNameAndRole(
    userId: string,
    companyName: string,
    role?: string,
  ): Promise<ApplicationRecord | null> {
    const targetKey = normalizeCompanyKey(companyName);
    if (!targetKey) return null;

    const { data, error } = await this.supabase.db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'unknown')
      .order('last_message_at', { ascending: false })
      .limit(200);

    if (error) this.raise('getLatestApplicationForCompanyNameAndRole', error);

    for (const row of data ?? []) {
      const app = this.mapApplication(row as DbApplicationRow);
      if (normalizeCompanyKey(app.company) !== targetKey) continue;
      if (!rolesOverlap(app.role, role)) continue;
      return app;
    }

    return null;
  }

  async createApplication(input: {
    userId: string;
    threadId: string;
    cycleIndex: number;
    platformId: string;
    company: string;
    companyId?: string;
    role?: string;
    status: ApplicationStatus;
    lastMessageId: string;
    lastMessageAt: Date;
  }): Promise<ApplicationRecord> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .insert({
        user_id: input.userId,
        thread_id: input.threadId,
        cycle_index: input.cycleIndex,
        platform_id: input.platformId,
        company: input.company,
        company_id: input.companyId ?? null,
        role: input.role ?? null,
        status: input.status,
        last_message_id: input.lastMessageId,
        last_message_at: input.lastMessageAt.toISOString(),
      })
      .select('*')
      .single();

    if (error) this.raise('createApplication', error);
    return this.mapApplication(data as DbApplicationRow);
  }

  async updateApplication(
    id: string,
    input: {
      status: ApplicationStatus;
      company: string;
      role?: string;
      lastMessageId: string;
      lastMessageAt: Date;
      companyId?: string;
    },
  ): Promise<ApplicationRecord> {
    const payload: Record<string, unknown> = {
      status: input.status,
      company: input.company,
      role: input.role ?? null,
      last_message_id: input.lastMessageId,
      last_message_at: input.lastMessageAt.toISOString(),
    };
    if (input.companyId) {
      payload.company_id = input.companyId;
    }

    const { data, error } = await this.supabase.db
      .from('applications')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) this.raise('updateApplication', error);
    return this.mapApplication(data as DbApplicationRow);
  }

  async markApplicationsGhosted(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { error } = await this.supabase.db
      .from('applications')
      .update({ status: 'ghosted' })
      .in('id', ids);

    if (error) this.raise('markApplicationsGhosted', error);
  }

  async insertProcessedEmail(input: {
    userId: string;
    messageId: string;
    threadId: string;
    platformId: string;
    subject?: string;
    fromAddress?: string;
    internalDate: Date;
    classificationStatus: ApplicationStatus | 'unknown';
    classificationSource: ClassificationSource;
    applicationId?: string;
    syncPhase?: 'platform' | 'company';
  }): Promise<ProcessedEmailRecord> {
    const { data, error } = await this.supabase.db
      .from('processed_emails')
      .insert({
        user_id: input.userId,
        message_id: input.messageId,
        thread_id: input.threadId,
        platform_id: input.platformId,
        subject: input.subject ?? null,
        from_address: input.fromAddress ?? null,
        internal_date: input.internalDate.toISOString(),
        classification_status: input.classificationStatus,
        classification_source: input.classificationSource,
        application_id: input.applicationId ?? null,
        sync_phase: input.syncPhase ?? 'platform',
      })
      .select('*')
      .single();

    if (error) this.raise('insertProcessedEmail', error);
    return this.mapProcessedEmail(data);
  }

  async listApplications(userId: string): Promise<ApplicationListItem[]> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'unknown')
      .order('updated_at', { ascending: false });

    if (error) this.raise('listApplications', error);

    return (data as DbApplicationRow[]).map((row) => ({
      id: row.id,
      company: row.company,
      role: row.role ?? undefined,
      status: row.status as ApplicationStatus,
      platformId: row.platform_id,
      appliedAt: row.created_at,
      lastMessageAt: row.last_message_at ?? undefined,
      updatedAt: row.updated_at,
    }));
  }

  async listAllApplications(userId: string): Promise<ApplicationRecord[]> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .select('*')
      .eq('user_id', userId);

    if (error) this.raise('listAllApplications', error);
    return (data as DbApplicationRow[]).map((row) =>
      this.mapApplication(row),
    );
  }

  async countApplicationsCreatedSince(
    userId: string,
    since: Date,
  ): Promise<number> {
    const { count, error } = await this.supabase.db
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());

    if (error) this.raise('countApplicationsCreatedSince', error);
    return count ?? 0;
  }

  async clearUserData(userId: string): Promise<void> {
    const tables = [
      'company_recruiter_emails',
      'company_domains',
      'discovered_companies',
      'processed_emails',
      'applications',
      'user_sync_platform_stats',
    ] as const;

    for (const table of tables) {
      const { error } = await this.supabase.db
        .from(table)
        .delete()
        .eq('user_id', userId);
      if (error) this.raise(`clearUserData.${table}`, error);
    }
  }

  async computeAggregates(userId: string): Promise<{
    totals: Omit<SyncResultResponse, 'scan' | 'byPlatform' | 'hasSynced'>;
    byPlatform: Record<string, PlatformSyncStats>;
  }> {
    const { data: emails, error: emailError } = await this.supabase.db
      .from('processed_emails')
      .select('platform_id')
      .eq('user_id', userId);

    if (emailError) this.raise('computeAggregates.emails', emailError);

    const { data: apps, error: appError } = await this.supabase.db
      .from('applications')
      .select('platform_id, status')
      .eq('user_id', userId)
      .neq('status', 'unknown');

    if (appError) this.raise('computeAggregates.apps', appError);

    const byPlatform: Record<string, PlatformSyncStats> = {};

    for (const row of emails ?? []) {
      const pid = row.platform_id as string;
      if (!byPlatform[pid]) {
        byPlatform[pid] = {
          emailsProcessed: 0,
          applicationsCount: 0,
          interviewsCount: 0,
          offersCount: 0,
        };
      }
      byPlatform[pid].emailsProcessed += 1;
    }

    let applicationsCount = 0;
    let activeCount = 0;
    let interviewsCount = 0;
    let offersCount = 0;

    for (const row of apps ?? []) {
      const pid = row.platform_id as string;
      const status = row.status as ApplicationStatus;
      if (!byPlatform[pid]) {
        byPlatform[pid] = {
          emailsProcessed: 0,
          applicationsCount: 0,
          interviewsCount: 0,
          offersCount: 0,
        };
      }
      applicationsCount += 1;
      byPlatform[pid].applicationsCount += 1;

      if (status === 'interview') {
        interviewsCount += 1;
        byPlatform[pid].interviewsCount += 1;
      }
      if (status === 'offer') {
        offersCount += 1;
        byPlatform[pid].offersCount += 1;
      }
      if (['applied', 'active', 'interview'].includes(status)) {
        activeCount += 1;
      }
    }

    const emailsProcessed = (emails ?? []).length;

    return {
      totals: {
        lastSyncedAt: new Date().toISOString(),
        emailsProcessed,
        applicationsCount,
        activeCount,
        interviewsCount,
        offersCount,
      },
      byPlatform,
    };
  }

  async recomputeAggregates(userId: string): Promise<{
    totals: Omit<SyncResultResponse, 'scan' | 'byPlatform' | 'hasSynced'>;
    byPlatform: Record<string, PlatformSyncStats>;
  }> {
    const { totals, byPlatform } = await this.computeAggregates(userId);

    await this.supabase.db.from('user_sync_platform_stats').delete().eq(
      'user_id',
      userId,
    );

    const statRows = Object.entries(byPlatform).map(([platformId, stats]) => ({
      user_id: userId,
      platform_id: platformId,
      emails_processed: stats.emailsProcessed,
      applications_count: stats.applicationsCount,
      interviews_count: stats.interviewsCount,
      offers_count: stats.offersCount,
    }));

    if (statRows.length > 0) {
      const { error: statError } = await this.supabase.db
        .from('user_sync_platform_stats')
        .insert(statRows);
      if (statError) this.raise('recomputeAggregates.stats', statError);
    }

    const { error: userError } = await this.supabase.db
      .from('users')
      .update({
        emails_processed: totals.emailsProcessed,
        applications_count: totals.applicationsCount,
        active_count: totals.activeCount,
        interviews_count: totals.interviewsCount,
        offers_count: totals.offersCount,
      })
      .eq('id', userId);

    if (userError) this.raise('recomputeAggregates.users', userError);

    return { totals, byPlatform };
  }

  async updateUserSyncCursor(
    userId: string,
    input: {
      lastSyncedAt: Date;
      lastGmailInternalDate?: Date;
      syncFromDate: Date;
      syncToDate: Date;
    },
  ): Promise<void> {
    const { error } = await this.supabase.db
      .from('users')
      .update({
        last_synced_at: input.lastSyncedAt.toISOString(),
        last_gmail_internal_date:
          input.lastGmailInternalDate?.toISOString() ?? null,
        sync_from_date: formatIsoDate(input.syncFromDate),
        sync_to_date: formatIsoDate(input.syncToDate),
      })
      .eq('id', userId);

    if (error) this.raise('updateUserSyncCursor', error);
  }

  async getPlatformStats(
    userId: string,
  ): Promise<Record<string, PlatformSyncStats>> {
    const { data, error } = await this.supabase.db
      .from('user_sync_platform_stats')
      .select('*')
      .eq('user_id', userId);

    if (error) this.raise('getPlatformStats', error);

    const result: Record<string, PlatformSyncStats> = {};
    for (const row of data ?? []) {
      result[row.platform_id as string] = {
        emailsProcessed: row.emails_processed as number,
        applicationsCount: row.applications_count as number,
        interviewsCount: row.interviews_count as number,
        offersCount: row.offers_count as number,
      };
    }
    return result;
  }

  private mapApplication(row: DbApplicationRow): ApplicationRecord {
    return {
      id: row.id,
      userId: row.user_id,
      threadId: row.thread_id,
      cycleIndex: row.cycle_index,
      platformId: row.platform_id,
      company: row.company,
      companyId: row.company_id ?? undefined,
      role: row.role ?? undefined,
      status: row.status as ApplicationStatus,
      lastMessageId: row.last_message_id ?? undefined,
      lastMessageAt: row.last_message_at
        ? new Date(row.last_message_at)
        : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapProcessedEmail(row: Record<string, unknown>): ProcessedEmailRecord {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      messageId: row.message_id as string,
      threadId: row.thread_id as string,
      platformId: row.platform_id as string,
      subject: (row.subject as string) ?? undefined,
      fromAddress: (row.from_address as string) ?? undefined,
      internalDate: new Date(row.internal_date as string),
      classificationStatus: row.classification_status as
        | ApplicationStatus
        | 'unknown',
      classificationSource: (row.classification_source as ClassificationSource) ??
        undefined,
      applicationId: (row.application_id as string) ?? undefined,
      processedAt: new Date(row.processed_at as string),
    };
  }

  private raise(operation: string, error: { message: string }): never {
    this.logger.error(`${operation} failed: ${error.message}`);
    throw new InternalServerErrorException('Database operation failed');
  }
}
