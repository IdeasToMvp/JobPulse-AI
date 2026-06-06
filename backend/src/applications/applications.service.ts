import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  ApplicationDetailResponse,
  ApplicationExtractedDetails,
  ApplicationListItem,
  ApplicationRecord,
  ApplicationStatus,
  ClassificationSource,
  CompanyApplicationSummary,
  DbApplicationRow,
  DbStatusHistoryRow,
  PlatformSyncStats,
  ProcessedEmailRecord,
  StatusHistoryEntry,
  StatusHistorySource,
  SyncResultResponse,
} from './application.entity';
import { ApplicationUserDetailsDto } from './dto/application-user-details.dto';
import { CreateManualApplicationDto } from './dto/create-manual-application.dto';
import { ManualApplicationStatus } from './dto/update-application-status.dto';
import {
  mergeUserDetails,
  parseUserDetails,
  userDetailsToDb,
} from './user-details.util';
import { normalizeCompanyKey, rolesOverlap } from '../sync/company-name.util';
import { formatIsoDate, startOfUtcDay } from '../sync/platform-filters';
import { randomUUID } from 'crypto';

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
    extractedDetails?: ApplicationExtractedDetails;
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
        extracted_details: input.extractedDetails ?? {},
      })
      .select('*')
      .single();

    if (error) this.raise('createApplication', error);
    return this.mapApplication(data as DbApplicationRow);
  }

  async touchApplicationMessage(
    applicationId: string,
    input: { lastMessageId: string; lastMessageAt: Date },
  ): Promise<ApplicationRecord> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .update({
        last_message_id: input.lastMessageId,
        last_message_at: input.lastMessageAt.toISOString(),
      })
      .eq('id', applicationId)
      .select('*')
      .single();

    if (error) this.raise('touchApplicationMessage', error);
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

  async markApplicationsGhosted(
    userId: string,
    ids: string[],
  ): Promise<void> {
    if (ids.length === 0) return;

    const now = new Date();
    for (const applicationId of ids) {
      const { error } = await this.supabase.db
        .from('applications')
        .update({ status: 'ghosted' })
        .eq('id', applicationId)
        .eq('user_id', userId);

      if (error) this.raise('markApplicationsGhosted', error);

      await this.appendStatusHistory({
        userId,
        applicationId,
        status: 'ghosted',
        source: 'sync',
        changedAt: now,
      });
    }
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

    if (error) {
      if (error.code === '23505') {
        const { data: existing, error: fetchError } = await this.supabase.db
          .from('processed_emails')
          .select('*')
          .eq('user_id', input.userId)
          .eq('message_id', input.messageId)
          .maybeSingle();

        if (!fetchError && existing) {
          return this.mapProcessedEmail(existing);
        }
      }

      if (error.code === '23503') {
        this.logger.error(
          `insertProcessedEmail rejected: user ${input.userId} not found (message ${input.messageId})`,
        );
        throw new NotFoundException(
          'User account not found. Please sign out and sign in again.',
        );
      }

      this.raise('insertProcessedEmail', error);
    }
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

    const apps = (data as DbApplicationRow[]).map((row) =>
      this.mapApplication(row),
    );
    const stats = this.buildCompanyStats(apps);

    return apps.map((app) => {
      const key = this.companyGroupKey(app);
      const group = stats.get(key);
      return {
        ...this.toListItem(app),
        companyApplyCount: group?.count,
        companyRoles: group?.roles,
      };
    });
  }

  async findByIdForUser(
    userId: string,
    applicationId: string,
  ): Promise<ApplicationRecord | null> {
    const { data, error } = await this.supabase.db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('id', applicationId)
      .maybeSingle();

    if (error) this.raise('findByIdForUser', error);
    return data ? this.mapApplication(data as DbApplicationRow) : null;
  }

  async getApplicationDetail(
    userId: string,
    applicationId: string,
  ): Promise<ApplicationDetailResponse> {
    const app = await this.findByIdForUser(userId, applicationId);
    if (!app) throw new NotFoundException('Application not found');

    const statusHistory = await this.getStatusHistory(userId, app);
    const companyApplications = await this.listCompanyApplications(userId, app);

    return {
      ...this.toListItem(app),
      statusHistory,
      companyApplications,
    };
  }

  async updateStatusManually(
    userId: string,
    applicationId: string,
    status: ManualApplicationStatus,
    details?: ApplicationUserDetailsDto,
  ): Promise<{
    application: ApplicationDetailResponse;
    previousStatus: ApplicationStatus;
    totals: Omit<SyncResultResponse, 'scan' | 'byPlatform' | 'hasSynced'>;
    lastSyncedAt: string | null;
  }> {
    const app = await this.findByIdForUser(userId, applicationId);
    if (!app) throw new NotFoundException('Application not found');
    if (app.status === status) {
      throw new BadRequestException('Application is already in this status');
    }

    const previousStatus = app.status;
    const now = new Date();
    const updatePayload: Record<string, unknown> = { status };

    if (details) {
      const merged = mergeUserDetails(app.userDetails, details, now.toISOString());
      updatePayload.user_details = userDetailsToDb(merged);
    }

    const { data, error } = await this.supabase.db
      .from('applications')
      .update(updatePayload)
      .eq('id', applicationId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) this.raise('updateStatusManually', error);

    await this.appendStatusHistory({
      userId,
      applicationId,
      status,
      source: 'user',
      changedAt: now,
    });

    const updated = this.mapApplication(data as DbApplicationRow);
    const { totals } = await this.recomputeAggregates(userId);
    const statusHistory = await this.getStatusHistory(userId, updated);

    const { data: userRow } = await this.supabase.db
      .from('users')
      .select('last_synced_at')
      .eq('id', userId)
      .maybeSingle();

    return {
      application: {
        ...this.toListItem(updated),
        statusHistory,
        companyApplications: await this.listCompanyApplications(userId, updated),
      },
      previousStatus,
      totals,
      lastSyncedAt: (userRow?.last_synced_at as string) ?? null,
    };
  }

  async updateUserDetailsManually(
    userId: string,
    applicationId: string,
    details: ApplicationUserDetailsDto,
  ): Promise<ApplicationDetailResponse> {
    const app = await this.findByIdForUser(userId, applicationId);
    if (!app) throw new NotFoundException('Application not found');

    const now = new Date();
    const merged = mergeUserDetails(app.userDetails, details, now.toISOString());

    const { data, error } = await this.supabase.db
      .from('applications')
      .update({ user_details: userDetailsToDb(merged) })
      .eq('id', applicationId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) this.raise('updateUserDetailsManually', error);

    const updated = this.mapApplication(data as DbApplicationRow);
    const statusHistory = await this.getStatusHistory(userId, updated);

    return {
      ...this.toListItem(updated),
      statusHistory,
      companyApplications: await this.listCompanyApplications(userId, updated),
    };
  }

  async createManualApplication(
    userId: string,
    dto: CreateManualApplicationDto,
  ): Promise<{
    application: ApplicationDetailResponse;
    totals: Omit<SyncResultResponse, 'scan' | 'byPlatform' | 'hasSynced'>;
    lastSyncedAt: string | null;
  }> {
    const appliedAt = startOfUtcDay(new Date(dto.appliedAt));
    if (Number.isNaN(appliedAt.getTime())) {
      throw new BadRequestException('Invalid applied date');
    }

    const today = startOfUtcDay(new Date());
    if (appliedAt > today) {
      throw new BadRequestException('Applied date cannot be in the future');
    }

    const now = new Date();
    const threadId = `manual:${randomUUID()}`;
    const userDetails = dto.details
      ? mergeUserDetails(undefined, dto.details, now.toISOString())
      : undefined;

    const { data, error } = await this.supabase.db
      .from('applications')
      .insert({
        user_id: userId,
        thread_id: threadId,
        cycle_index: 0,
        platform_id: dto.platformId,
        company: dto.company.trim(),
        role: dto.role.trim(),
        status: dto.status,
        last_message_at: appliedAt.toISOString(),
        created_at: appliedAt.toISOString(),
        user_details: userDetails ? userDetailsToDb(userDetails) : {},
      })
      .select('*')
      .single();

    if (error) this.raise('createManualApplication', error);

    const created = this.mapApplication(data as DbApplicationRow);

    await this.appendStatusHistory({
      userId,
      applicationId: created.id,
      status: dto.status,
      source: 'user',
      changedAt: appliedAt,
    });

    const { totals } = await this.recomputeAggregates(userId);
    const statusHistory = await this.getStatusHistory(userId, created);

    const { data: userRow } = await this.supabase.db
      .from('users')
      .select('last_synced_at')
      .eq('id', userId)
      .maybeSingle();

    return {
      application: {
        ...this.toListItem(created),
        statusHistory,
        companyApplications: await this.listCompanyApplications(userId, created),
      },
      totals,
      lastSyncedAt: (userRow?.last_synced_at as string) ?? null,
    };
  }

  async appendStatusHistory(input: {
    userId: string;
    applicationId: string;
    status: ApplicationStatus;
    source: StatusHistorySource;
    changedAt?: Date;
  }): Promise<void> {
    const { error } = await this.supabase.db
      .from('application_status_history')
      .insert({
        user_id: input.userId,
        application_id: input.applicationId,
        status: input.status,
        source: input.source,
        changed_at: (input.changedAt ?? new Date()).toISOString(),
      });

    if (error) {
      if (error.message?.includes('application_status_history')) return;
      this.raise('appendStatusHistory', error);
    }
  }

  async getStatusHistory(
    userId: string,
    app: ApplicationRecord,
  ): Promise<StatusHistoryEntry[]> {
    const { data, error } = await this.supabase.db
      .from('application_status_history')
      .select('*')
      .eq('user_id', userId)
      .eq('application_id', app.id)
      .order('changed_at', { ascending: true });

    if (error) {
      if (error.message?.includes('application_status_history')) {
        return [this.seedHistoryEntry(app)];
      }
      this.raise('getStatusHistory', error);
    }

    const rows = (data as DbStatusHistoryRow[]) ?? [];
    if (rows.length === 0) {
      return [this.seedHistoryEntry(app)];
    }

    return rows.map((row) => ({
      status: row.status as ApplicationStatus,
      changedAt: row.changed_at,
      source: row.source as StatusHistorySource,
    }));
  }

  private seedHistoryEntry(app: ApplicationRecord): StatusHistoryEntry {
    const initialStatus =
      app.status === 'unknown' ? ('applied' as ApplicationStatus) : app.status;
    return {
      status: initialStatus,
      changedAt: app.createdAt.toISOString(),
      source: 'sync',
    };
  }

  private toListItem(app: ApplicationRecord): ApplicationListItem {
    return {
      id: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      platformId: app.platformId,
      appliedAt: app.createdAt.toISOString(),
      lastMessageAt: app.lastMessageAt?.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      isManual: app.threadId.startsWith('manual:'),
      extractedDetails: app.extractedDetails,
      userDetails: app.userDetails,
    };
  }

  private companyGroupKey(app: ApplicationRecord): string {
    return app.companyId ?? normalizeCompanyKey(app.company);
  }

  private buildCompanyStats(apps: ApplicationRecord[]): Map<
    string,
    { count: number; roles: string[] }
  > {
    const map = new Map<string, { count: number; roles: Set<string> }>();
    for (const app of apps) {
      const key = this.companyGroupKey(app);
      if (!map.has(key)) {
        map.set(key, { count: 0, roles: new Set() });
      }
      const entry = map.get(key)!;
      entry.count += 1;
      if (app.role) entry.roles.add(app.role);
    }

    const result = new Map<string, { count: number; roles: string[] }>();
    for (const [key, value] of map) {
      result.set(key, {
        count: value.count,
        roles: [...value.roles],
      });
    }
    return result;
  }

  private async listCompanyApplications(
    userId: string,
    app: ApplicationRecord,
  ): Promise<CompanyApplicationSummary[]> {
    let query = this.supabase.db
      .from('applications')
      .select('id, role, status, created_at')
      .eq('user_id', userId)
      .neq('status', 'unknown')
      .order('created_at', { ascending: true });

    if (app.companyId) {
      query = query.eq('company_id', app.companyId);
    } else {
      const key = normalizeCompanyKey(app.company);
      const { data, error } = await this.supabase.db
        .from('applications')
        .select('id, role, status, created_at, company')
        .eq('user_id', userId)
        .neq('status', 'unknown')
        .order('created_at', { ascending: true });

      if (error) this.raise('listCompanyApplications', error);
      return (data ?? [])
        .filter(
          (row) => normalizeCompanyKey(row.company as string) === key,
        )
        .map((row) => ({
          id: row.id as string,
          role: (row.role as string) ?? undefined,
          status: row.status as ApplicationStatus,
          appliedAt: row.created_at as string,
        }));
    }

    const { data, error } = await query;
    if (error) this.raise('listCompanyApplications', error);

    return (data ?? []).map((row) => ({
      id: row.id as string,
      role: (row.role as string) ?? undefined,
      status: row.status as ApplicationStatus,
      appliedAt: row.created_at as string,
    }));
  }

  private parseExtractedDetails(
    raw: Record<string, unknown> | null | undefined,
  ): ApplicationExtractedDetails | undefined {
    if (!raw || Object.keys(raw).length === 0) return undefined;
    const source = raw.source as ApplicationExtractedDetails['source'];
    if (!source) return undefined;
    return {
      company: (raw.company as string) ?? undefined,
      role: (raw.role as string) ?? undefined,
      salary: (raw.salary as string) ?? undefined,
      location: (raw.location as string) ?? undefined,
      employmentType: (raw.employmentType as string) ?? undefined,
      source,
      confidence:
        typeof raw.confidence === 'number' ? raw.confidence : undefined,
    };
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
      'application_status_history',
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

    let statusAppliedCount = 0;
    let activeCount = 0;
    let interviewsCount = 0;
    let offersCount = 0;
    let rejectedCount = 0;
    let ghostedCount = 0;

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
      byPlatform[pid].applicationsCount += 1;

      switch (status) {
        case 'applied':
          statusAppliedCount += 1;
          break;
        case 'active':
          activeCount += 1;
          break;
        case 'interview':
          interviewsCount += 1;
          byPlatform[pid].interviewsCount += 1;
          break;
        case 'offer':
          offersCount += 1;
          byPlatform[pid].offersCount += 1;
          break;
        case 'rejected':
          rejectedCount += 1;
          break;
        case 'ghosted':
          ghostedCount += 1;
          break;
        default:
          break;
      }
    }

    const appliedCount =
      statusAppliedCount +
      activeCount +
      interviewsCount +
      offersCount +
      rejectedCount +
      ghostedCount;

    const emailsProcessed = (emails ?? []).length;

    return {
      totals: {
        lastSyncedAt: new Date().toISOString(),
        emailsProcessed,
        applicationsCount: appliedCount,
        appliedCount,
        activeCount,
        interviewsCount,
        offersCount,
        rejectedCount,
        ghostedCount,
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
        applications_count: totals.appliedCount,
        applied_count: totals.appliedCount,
        active_count: totals.activeCount,
        interviews_count: totals.interviewsCount,
        offers_count: totals.offersCount,
        rejected_count: totals.rejectedCount,
        ghosted_count: totals.ghostedCount,
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
      extractedDetails: this.parseExtractedDetails(row.extracted_details),
      userDetails: parseUserDetails(row.user_details),
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
