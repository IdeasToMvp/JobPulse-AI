import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  SyncResultResponse,
} from '../applications/application.entity';
import { ApplicationsService } from '../applications/applications.service';
import { GmailService } from '../gmail/gmail.service';
import { JobPlatformId } from '../users/job-platforms';
import { JobSourcesService } from '../users/job-sources.service';
import { UsersService } from '../users/users.service';
import { AiClassifierService } from './ai-classifier.service';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { ApplicationMatcherService } from './application-matcher.service';
import { CompanyDiscoveryService } from './company-discovery.service';
import {
  buildCompanyGmailQueries,
  MAX_MESSAGES_PER_COMPANY,
} from './company-query-builder';
import {
  CompanySyncResponse,
  PlatformSyncResponse,
} from './company.entity';
import { FinalizeSyncDto } from './dto/finalize-sync.dto';
import { RunSyncDto } from './dto/run-sync.dto';
import {
  buildGmailQuery,
  formatIsoDate,
  isAfterSyncCursor,
  matchesPlatform,
  resolveAutoSyncDateRange,
  resolveIncrementalFromDate,
  resolveSyncDateRange,
} from './platform-filters';
import { RuleEngineService } from './rule-engine.service';
import { SyncCancellationService } from './sync-cancellation.service';

const AI_CONFIDENCE_THRESHOLD = 0.7;

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jobSources: JobSourcesService,
    private readonly gmail: GmailService,
    private readonly ruleEngine: RuleEngineService,
    private readonly aiClassifier: AiClassifierService,
    private readonly lifecycle: ApplicationLifecycleService,
    private readonly applications: ApplicationsService,
    private readonly companyDiscovery: CompanyDiscoveryService,
    private readonly applicationMatcher: ApplicationMatcherService,
    private readonly cancellation: SyncCancellationService,
  ) {}

  async runSync(userId: string, dto?: RunSyncDto): Promise<SyncResultResponse> {
    const platformResult = await this.runPlatformDiscovery(userId, dto);
    this.cancellation.throwIfCancelled(userId);
    const companyResult = await this.runCompanyDiscovery(userId, dto);
    this.cancellation.throwIfCancelled(userId);
    return this.finalizeSync(userId, {
      fromDate: platformResult.fromDate,
      toDate: platformResult.toDate,
      maxInternalDate: platformResult.maxInternalDate,
      newMessages: platformResult.newMessages,
      skippedProcessed:
        platformResult.skippedProcessed + companyResult.skippedProcessed,
      aiCalls: platformResult.aiCalls + companyResult.aiCalls,
      companyEmailsProcessed: companyResult.companyEmailsProcessed,
      companiesDiscovered: platformResult.companiesDiscovered,
      companiesScanned: companyResult.companiesScanned,
    });
  }

  async runAutoSync(userId: string): Promise<SyncResultResponse | null> {
    const user = await this.users.findById(userId);
    if (!user) return null;

    if (!user.lastGmailInternalDate) {
      this.logger.warn(`Skipping auto sync for ${userId}: no Gmail cursor`);
      return null;
    }

    this.cancellation.beginSync(userId);
    try {
      return await this.runSync(userId, { incrementalOnly: true });
    } finally {
      this.cancellation.endSync(userId);
    }
  }

  private resolveSyncWindow(
    user: { lastGmailInternalDate?: Date },
    dto?: RunSyncDto,
  ): {
    fromDate: Date;
    toDate: Date;
    incrementalFrom: Date;
    syncCursor?: Date;
  } {
    if (dto?.incrementalOnly) {
      if (!user.lastGmailInternalDate) {
        throw new BadRequestException(
          'Incremental sync requires a prior sync cursor',
        );
      }
      const { fromDate, toDate } = resolveAutoSyncDateRange(
        user.lastGmailInternalDate,
      );
      return {
        fromDate,
        toDate,
        incrementalFrom: fromDate,
        syncCursor: user.lastGmailInternalDate,
      };
    }

    const { fromDate, toDate } = resolveSyncDateRange(dto);
    const incrementalFrom = resolveIncrementalFromDate(
      user.lastGmailInternalDate,
      fromDate,
    );
    return { fromDate, toDate, incrementalFrom };
  }

  async runPlatformDiscovery(
    userId: string,
    dto?: RunSyncDto,
  ): Promise<PlatformSyncResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const platformIds = await this.jobSources.getForUser(userId);
    if (platformIds.length === 0) {
      throw new BadRequestException(
        'Select at least one job source before syncing',
      );
    }

    const tokens = await this.users.getGoogleTokens(userId);
    const { fromDate, toDate, incrementalFrom, syncCursor } =
      this.resolveSyncWindow(user, dto);
    const gmailAfter = syncCursor ? { afterCursor: syncCursor } : undefined;

    let newMessages = 0;
    let skippedProcessed = 0;
    let aiCalls = 0;
    let maxInternalDate: Date | undefined = user.lastGmailInternalDate;

    for (const platformId of platformIds) {
      this.cancellation.throwIfCancelled(userId);

      const query = buildGmailQuery(
        platformId as JobPlatformId,
        incrementalFrom,
        toDate,
        gmailAfter,
      );
      const messageIds = await this.gmail.listMessageIds(query, tokens);

      for (const messageId of messageIds) {
        this.cancellation.throwIfCancelled(userId);

        if (await this.applications.isMessageProcessed(userId, messageId)) {
          skippedProcessed += 1;
          continue;
        }

        const meta = await this.gmail.getMessageMetadata(messageId, tokens);
        if (!meta) continue;

        if (syncCursor && !isAfterSyncCursor(meta.internalDate, syncCursor)) {
          skippedProcessed += 1;
          continue;
        }

        if (
          !matchesPlatform(
            meta.from,
            meta.subject,
            platformId as JobPlatformId,
          )
        ) {
          continue;
        }

        newMessages += 1;
        if (!maxInternalDate || meta.internalDate > maxInternalDate) {
          maxInternalDate = meta.internalDate;
        }

        const ruleResult = this.ruleEngine.classify(meta.from, meta.subject);
        let status: ApplicationStatus | 'unknown' = ruleResult.status;
        let company = ruleResult.company;
        let role = ruleResult.role;
        let source: 'rule' | 'ai' | 'none' = 'rule';
        let applicationId: string | undefined;
        let companyId: string | undefined;

        if (
          ruleResult.confidence === 'none' ||
          ruleResult.confidence === 'low'
        ) {
          this.cancellation.throwIfCancelled(userId);
          const aiResult = await this.aiClassifier.classify({
            from: meta.from,
            subject: meta.subject,
            platformId,
            ruleConfidence: ruleResult.confidence,
          });
          if (aiResult) {
            aiCalls += 1;
            if (aiResult.confidence >= AI_CONFIDENCE_THRESHOLD) {
              status = aiResult.status;
              company = aiResult.company;
              role = aiResult.role;
              source = 'ai';
            } else {
              status = 'unknown';
              source = 'ai';
            }
          } else {
            status = 'unknown';
            source = 'none';
          }
        }

        if (company && company !== 'Unknown Company') {
          const discovered = await this.companyDiscovery.upsertFromPlatformEmail(
            {
              userId,
              companyName: company,
              platformId,
              status,
              fromAddress: meta.from,
              messageAt: meta.internalDate,
            },
          );
          companyId = discovered?.id;
        }

        if (status !== 'unknown') {
          applicationId = await this.applicationMatcher.matchAndUpsert({
            userId,
            platformId,
            threadId: meta.threadId,
            messageId: meta.id,
            messageAt: meta.internalDate,
            status,
            companyName: company,
            role,
            companyId,
          });
        }

        await this.applications.insertProcessedEmail({
          userId,
          messageId: meta.id,
          threadId: meta.threadId,
          platformId,
          subject: meta.subject,
          fromAddress: meta.from,
          internalDate: meta.internalDate,
          classificationStatus: status,
          classificationSource: source,
          applicationId,
          syncPhase: 'platform',
        });
      }
    }

    const companiesDiscovered =
      await this.companyDiscovery.countCompanies(userId);

    return {
      newMessages,
      skippedProcessed,
      aiCalls,
      companiesDiscovered,
      maxInternalDate: maxInternalDate?.toISOString(),
      fromDate: formatIsoDate(fromDate),
      toDate: formatIsoDate(toDate),
    };
  }

  async runCompanyDiscovery(
    userId: string,
    dto?: RunSyncDto,
  ): Promise<CompanySyncResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const tokens = await this.users.getGoogleTokens(userId);
    const { fromDate, toDate, incrementalFrom, syncCursor } =
      this.resolveSyncWindow(user, dto);
    const gmailAfter = syncCursor ? { afterCursor: syncCursor } : undefined;

    const isIncremental = dto?.incrementalOnly ?? false;
    const companies = await this.companyDiscovery.listCompaniesForPhase2(
      userId,
      isIncremental,
    );

    let companyEmailsProcessed = 0;
    let skippedProcessed = 0;
    let aiCalls = 0;
    let companiesScanned = 0;

    for (const company of companies) {
      this.cancellation.throwIfCancelled(userId);

      companiesScanned += 1;
      const queries = buildCompanyGmailQueries(
        {
          companyId: company.id,
          canonicalName: company.canonicalName,
          domains: company.domains,
          recruiterEmails: company.recruiterEmails,
        },
        incrementalFrom,
        toDate,
        gmailAfter,
      );

      let companyMessageCount = 0;

      for (const query of queries) {
        const messageIds = await this.gmail.listMessageIds(query, tokens);

        for (const messageId of messageIds) {
          this.cancellation.throwIfCancelled(userId);

          if (companyMessageCount >= MAX_MESSAGES_PER_COMPANY) break;

          if (await this.applications.isMessageProcessed(userId, messageId)) {
            skippedProcessed += 1;
            continue;
          }

          const meta = await this.gmail.getMessageMetadata(messageId, tokens);
          if (!meta) continue;

          if (syncCursor && !isAfterSyncCursor(meta.internalDate, syncCursor)) {
            skippedProcessed += 1;
            continue;
          }

          companyMessageCount += 1;
          companyEmailsProcessed += 1;

          const ruleResult = this.ruleEngine.classify(meta.from, meta.subject);
          let status: ApplicationStatus | 'unknown' = ruleResult.status;
          let role = ruleResult.role;
          let source: 'rule' | 'ai' | 'none' = 'rule';
          let applicationId: string | undefined;

          if (
            ruleResult.confidence === 'none' ||
            ruleResult.confidence === 'low'
          ) {
            this.cancellation.throwIfCancelled(userId);
            const aiResult = await this.aiClassifier.classify({
              from: meta.from,
              subject: meta.subject,
              platformId: 'company_direct',
              ruleConfidence: ruleResult.confidence,
            });
            if (aiResult) {
              aiCalls += 1;
              if (aiResult.confidence >= AI_CONFIDENCE_THRESHOLD) {
                status = aiResult.status;
                role = aiResult.role ?? role;
                source = 'ai';
              } else {
                status = 'unknown';
                source = 'ai';
              }
            } else {
              status = 'unknown';
              source = 'none';
            }
          }

          await this.companyDiscovery.learnRecruiterEmail({
            userId,
            companyId: company.id,
            fromAddress: meta.from,
            messageAt: meta.internalDate,
          });

          if (status !== 'unknown') {
            applicationId = await this.applicationMatcher.matchAndUpsert({
              userId,
              platformId: 'company_direct',
              threadId: meta.threadId,
              messageId: meta.id,
              messageAt: meta.internalDate,
              companyId: company.id,
              companyName: company.canonicalName,
              role,
              status,
            });
          }

          await this.applications.insertProcessedEmail({
            userId,
            messageId: meta.id,
            threadId: meta.threadId,
            platformId: 'company_direct',
            subject: meta.subject,
            fromAddress: meta.from,
            internalDate: meta.internalDate,
            classificationStatus: status,
            classificationSource: source,
            applicationId,
            syncPhase: 'company',
          });
        }

        if (companyMessageCount >= MAX_MESSAGES_PER_COMPANY) break;
      }
    }

    return {
      companyEmailsProcessed,
      skippedProcessed,
      aiCalls,
      companiesScanned,
      fromDate: formatIsoDate(fromDate),
      toDate: formatIsoDate(toDate),
    };
  }

  async finalizeSync(
    userId: string,
    dto?: FinalizeSyncDto,
  ): Promise<SyncResultResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const allApps = await this.applications.listAllApplications(userId);
    const ghostedIds = this.lifecycle.findGhostedCandidates(
      allApps,
      new Date(),
    );
    await this.applications.markApplicationsGhosted(ghostedIds);

    const now = new Date();
    const fromDate = dto?.fromDate
      ? new Date(dto.fromDate)
      : user.syncFromDate ?? now;
    const toDate = dto?.toDate ? new Date(dto.toDate) : user.syncToDate ?? now;
    const maxInternalDate = dto?.maxInternalDate
      ? new Date(dto.maxInternalDate)
      : user.lastGmailInternalDate;

    await this.applications.updateUserSyncCursor(userId, {
      lastSyncedAt: now,
      lastGmailInternalDate: maxInternalDate,
      syncFromDate: fromDate,
      syncToDate: toDate,
    });

    const { totals, byPlatform } =
      await this.applications.recomputeAggregates(userId);

    const newMessages = dto?.newMessages ?? 0;
    const skippedProcessed = dto?.skippedProcessed ?? 0;
    const aiCalls = dto?.aiCalls ?? 0;
    const companyEmailsProcessed = dto?.companyEmailsProcessed ?? 0;
    const companiesDiscovered = dto?.companiesDiscovered ?? 0;
    const companiesScanned = dto?.companiesScanned ?? 0;

    return {
      ...totals,
      lastSyncedAt: now.toISOString(),
      hasSynced: true,
      scan: {
        fromDate: formatIsoDate(fromDate),
        toDate: formatIsoDate(toDate),
        newMessages,
        skippedProcessed,
        aiCalls,
        companiesDiscovered,
        companyEmailsProcessed,
        companiesScanned,
      },
      byPlatform,
    };
  }

  async finalizePartialSync(userId: string): Promise<SyncResultResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const companiesDiscovered =
      await this.companyDiscovery.countCompanies(userId);

    return this.finalizeSync(userId, {
      fromDate: user.syncFromDate?.toISOString().slice(0, 10),
      toDate: user.syncToDate?.toISOString().slice(0, 10),
      maxInternalDate: user.lastGmailInternalDate?.toISOString(),
      companiesDiscovered,
    });
  }

  async clearUserData(userId: string): Promise<void> {
    try {
      await this.users.resetSyncData(userId);
    } catch (error) {
      this.logger.error(`clearUserData failed: ${error}`);
      throw new InternalServerErrorException('Failed to clear user data');
    }
  }

}
