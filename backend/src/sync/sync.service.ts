import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ActivitiesService } from '../activities/activities.service';
import {
  ApplicationExtractedDetails,
  ApplicationStatus,
  SyncResultResponse,
} from '../applications/application.entity';
import { ApplicationsService } from '../applications/applications.service';
import { GmailService, GmailTokens } from '../gmail/gmail.service';
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
import { CompanySyncResponse, PlatformSyncResponse } from './company.entity';
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
  sortPlatformsForSync,
} from './platform-filters';
import { RuleEngineService } from './rule-engine.service';
import { SyncCancellationService } from './sync-cancellation.service';
import {
  isNaukriStatusEmail,
  parseNaukriStatusContent,
} from './naukri-status.parser';
import {
  isIndeedApplyMessage,
  parseIndeedApplyContent,
} from './indeed-apply.parser';
import {
  isLinkedInApplyMessage,
  parseLinkedInApplyContent,
} from './linkedin-apply.parser';
import {
  matchesPlatformApplyKeywords,
  usesSenderEmailFilter,
} from './platform-sender-emails';

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
    private readonly activities: ActivitiesService,
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

    const platformIds = sortPlatformsForSync(
      await this.jobSources.getForUser(userId),
    );
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
        platformId,
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

        if (!matchesPlatform(meta.from, meta.subject, platformId)) {
          continue;
        }

        newMessages += 1;
        if (!maxInternalDate || meta.internalDate > maxInternalDate) {
          maxInternalDate = meta.internalDate;
        }

        if (
          platformId === 'naukri' &&
          isNaukriStatusEmail(meta.from, meta.subject)
        ) {
          try {
            const statusResult = await this.processNaukriStatusEmail(
              userId,
              platformId,
              meta,
              tokens,
            );
            aiCalls += statusResult.aiCalls;
          } catch (error) {
            this.logger.error(
              `Naukri status sync skipped message ${messageId} for user ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          }
          continue;
        }

        if (
          platformId === 'indeed' &&
          isIndeedApplyMessage(meta.from, meta.subject)
        ) {
          try {
            const indeedResult = await this.processIndeedApplyEmail(
              userId,
              platformId,
              meta,
              tokens,
            );
            aiCalls += indeedResult.aiCalls;
          } catch (error) {
            this.logger.error(
              `Indeed apply sync skipped message ${messageId} for user ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          }
          continue;
        }

        if (
          platformId === 'linkedin' &&
          isLinkedInApplyMessage(meta.from, meta.subject)
        ) {
          try {
            const linkedInResult = await this.processLinkedInApplyEmail(
              userId,
              platformId,
              meta,
              tokens,
            );
            aiCalls += linkedInResult.aiCalls;
          } catch (error) {
            this.logger.error(
              `LinkedIn apply sync skipped message ${messageId} for user ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          }
          continue;
        }

        try {
          const genericResult = await this.processGenericPlatformEmail(
            userId,
            platformId,
            meta,
            tokens,
          );
          aiCalls += genericResult.aiCalls;
        } catch (error) {
          this.logger.error(
            `Platform sync skipped message ${messageId} for user ${userId}: ${error instanceof Error ? error.message : error}`,
          );
        }
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
    const aiCalls = 0;
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

          try {
            const ruleResult = this.ruleEngine.detectApplyConfirmation(
              meta.from,
              meta.subject,
            );

            await this.companyDiscovery.learnRecruiterEmail({
              userId,
              companyId: company.id,
              fromAddress: meta.from,
              messageAt: meta.internalDate,
            });

            await this.applications.insertProcessedEmail({
              userId,
              messageId: meta.id,
              threadId: meta.threadId,
              platformId: 'company_direct',
              subject: meta.subject,
              fromAddress: meta.from,
              internalDate: meta.internalDate,
              classificationStatus: ruleResult.isApply ? 'applied' : 'unknown',
              classificationSource: 'rule',
              syncPhase: 'company',
            });
          } catch (error) {
            this.logger.error(
              `Company sync skipped message ${messageId} for user ${userId}: ${error instanceof Error ? error.message : error}`,
            );
          }
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
    await this.applications.markApplicationsGhosted(userId, ghostedIds);

    const now = new Date();
    const syncSince = user.lastSyncedAt ?? new Date(0);
    const newApplications =
      await this.applications.countApplicationsCreatedSince(userId, syncSince);

    const fromDate = dto?.fromDate
      ? new Date(dto.fromDate)
      : (user.syncFromDate ?? now);
    const toDate = dto?.toDate
      ? new Date(dto.toDate)
      : (user.syncToDate ?? now);
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

    if (dto?.newMessages !== undefined) {
      await this.activities.recordSyncComplete({
        userId,
        newMessages,
        newApplications,
        occurredAt: now,
      });
    }

    return {
      ...totals,
      lastSyncedAt: now.toISOString(),
      hasSynced: true,
      scan: {
        fromDate: formatIsoDate(fromDate),
        toDate: formatIsoDate(toDate),
        newMessages,
        newApplications,
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

  private async processGenericPlatformEmail(
    userId: string,
    platformId: string,
    meta: {
      id: string;
      threadId: string;
      from: string;
      subject: string;
      internalDate: Date;
    },
    tokens: GmailTokens,
  ): Promise<{ aiCalls: number }> {
    this.cancellation.throwIfCancelled(userId);

    const jobPlatformId = platformId as JobPlatformId;
    const usesSender = usesSenderEmailFilter(jobPlatformId);

    const content = await this.gmail.getMessageContent(meta.id, tokens);
    const bodyForAi =
      content?.plainText ?? content?.htmlAsText ?? content?.html ?? '';

    if (
      !usesSender &&
      !matchesPlatformApplyKeywords(meta.subject, bodyForAi, jobPlatformId)
    ) {
      await this.applications.insertProcessedEmail({
        userId,
        messageId: meta.id,
        threadId: meta.threadId,
        platformId,
        subject: meta.subject,
        fromAddress: meta.from,
        internalDate: meta.internalDate,
        classificationStatus: 'unknown',
        classificationSource: 'rule',
        syncPhase: 'platform',
      });
      return { aiCalls: 0 };
    }

    const ruleResult = this.ruleEngine.detectApplyConfirmation(
      meta.from,
      meta.subject,
    );
    let company = ruleResult.company;
    let role = ruleResult.role;
    let isApply = ruleResult.isApply;
    let extractedDetails: ApplicationExtractedDetails = {
      company:
        ruleResult.company !== 'Unknown Company'
          ? ruleResult.company
          : undefined,
      role: ruleResult.role,
      source: 'rule',
    };
    let source: 'rule' | 'ai' | 'mixed' = 'rule';
    let applicationId: string | undefined;
    let companyId: string | undefined;
    let aiCalls = 0;

    const needsAi =
      ruleResult.confidence === 'none' ||
      ruleResult.confidence === 'low' ||
      company === 'Unknown Company' ||
      !role;

    if (needsAi) {
      this.cancellation.throwIfCancelled(userId);
      const aiResult = await this.aiClassifier.extractApplicationDetails({
        from: meta.from,
        subject: meta.subject,
        platformId,
        ruleConfidence: ruleResult.confidence,
        ruleIsApply: ruleResult.isApply,
        body: bodyForAi,
        html: content?.html,
      });
      if (aiResult) {
        aiCalls += 1;
        const merged = this.aiClassifier.mergeExtractedDetails(
          ruleResult,
          aiResult,
        );
        isApply = merged.isApply;
        company = merged.company;
        role = merged.role;
        extractedDetails = merged.extractedDetails;
        source = merged.source;
      }
    }

    if (company && company !== 'Unknown Company') {
      const discovered = await this.companyDiscovery.upsertFromPlatformEmail({
        userId,
        companyName: company,
        platformId,
        fromAddress: meta.from,
        messageAt: meta.internalDate,
      });
      companyId = discovered?.id;
    }

    const classificationStatus: ApplicationStatus | 'unknown' = isApply
      ? 'applied'
      : 'unknown';

    if (isApply) {
      applicationId = await this.applicationMatcher.matchAndUpsert({
        userId,
        platformId,
        threadId: meta.threadId,
        messageId: meta.id,
        messageAt: meta.internalDate,
        companyName: company,
        role,
        companyId,
        extractedDetails,
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
      classificationStatus,
      classificationSource: source === 'mixed' ? 'ai' : source,
      applicationId,
      syncPhase: 'platform',
    });

    return { aiCalls };
  }

  private async processNaukriStatusEmail(
    userId: string,
    platformId: string,
    meta: {
      id: string;
      threadId: string;
      from: string;
      subject: string;
      internalDate: Date;
    },
    tokens: GmailTokens,
  ): Promise<{ aiCalls: number }> {
    this.cancellation.throwIfCancelled(userId);

    const content = await this.gmail.getMessageContent(meta.id, tokens);
    if (!content) {
      this.logger.warn(
        `[Naukri status] failed to fetch message body messageId=${meta.id}`,
      );
    }

    const parsed = parseNaukriStatusContent({
      plainText: content?.plainText,
      html: content?.html,
      htmlAsText: content?.htmlAsText,
      messageDate: meta.internalDate,
    });
    let application = parsed.application;
    let aiCalls = 0;
    let classificationSource: 'rule' | 'ai' = 'rule';

    const bodyForAi =
      content?.plainText ?? content?.htmlAsText ?? content?.html ?? '';

    if (!application && bodyForAi.trim()) {
      this.cancellation.throwIfCancelled(userId);
      const aiResult = await this.aiClassifier.extractNaukriStatusApplication({
        subject: meta.subject,
        body: bodyForAi,
        html: content?.html,
      });
      if (aiResult) {
        application = aiResult;
        aiCalls += 1;
        classificationSource = 'ai';
      }
    }

    if (!application) {
      await this.applications.insertProcessedEmail({
        userId,
        messageId: meta.id,
        threadId: meta.threadId,
        platformId,
        subject: meta.subject,
        fromAddress: meta.from,
        internalDate: meta.internalDate,
        classificationStatus: 'unknown',
        classificationSource: aiCalls > 0 ? 'ai' : 'rule',
        syncPhase: 'platform',
      });
      return { aiCalls };
    }

    const discovered = await this.companyDiscovery.upsertFromPlatformEmail({
      userId,
      companyName: application.company,
      platformId,
      fromAddress: meta.from,
      messageAt: meta.internalDate,
    });

    const applicationId = await this.applicationMatcher.matchAndUpsert({
      userId,
      platformId,
      threadId: meta.threadId,
      messageId: meta.id,
      messageAt: meta.internalDate,
      appliedAt: application.appliedAt,
      companyName: application.company,
      role: application.role,
      companyId: discovered?.id,
      extractedDetails: {
        company: application.company,
        role: application.role,
        location: application.location,
        source: classificationSource === 'ai' ? 'ai' : 'rule',
      },
    });

    await this.applications.insertProcessedEmail({
      userId,
      messageId: meta.id,
      threadId: meta.threadId,
      platformId,
      subject: meta.subject,
      fromAddress: meta.from,
      internalDate: meta.internalDate,
      classificationStatus: 'applied',
      classificationSource,
      applicationId,
      syncPhase: 'platform',
    });

    return { aiCalls };
  }

  private async processIndeedApplyEmail(
    userId: string,
    platformId: string,
    meta: {
      id: string;
      threadId: string;
      from: string;
      subject: string;
      internalDate: Date;
    },
    tokens: GmailTokens,
  ): Promise<{ aiCalls: number }> {
    this.cancellation.throwIfCancelled(userId);

    const content = await this.gmail.getMessageContent(meta.id, tokens);
    if (!content) {
      this.logger.warn(
        `[Indeed apply] failed to fetch message body messageId=${meta.id}`,
      );
    }

    const parsed = parseIndeedApplyContent({
      subject: meta.subject,
      plainText: content?.plainText,
      html: content?.html,
      htmlAsText: content?.htmlAsText,
      messageDate: meta.internalDate,
    });
    let application = parsed.application;
    let aiCalls = 0;
    let classificationSource: 'rule' | 'ai' = 'rule';

    const bodyForAi =
      content?.plainText ?? content?.htmlAsText ?? content?.html ?? '';

    if (!application && bodyForAi.trim()) {
      this.cancellation.throwIfCancelled(userId);
      const aiResult = await this.aiClassifier.extractIndeedApplyApplication({
        subject: meta.subject,
        body: bodyForAi,
        html: content?.html,
      });
      if (aiResult) {
        application = {
          ...aiResult,
          appliedAt: meta.internalDate,
        };
        aiCalls += 1;
        classificationSource = 'ai';
      }
    }

    if (!application) {
      await this.applications.insertProcessedEmail({
        userId,
        messageId: meta.id,
        threadId: meta.threadId,
        platformId,
        subject: meta.subject,
        fromAddress: meta.from,
        internalDate: meta.internalDate,
        classificationStatus: 'unknown',
        classificationSource: aiCalls > 0 ? 'ai' : 'rule',
        syncPhase: 'platform',
      });
      return { aiCalls };
    }

    const discovered = await this.companyDiscovery.upsertFromPlatformEmail({
      userId,
      companyName: application.company,
      platformId,
      fromAddress: meta.from,
      messageAt: meta.internalDate,
    });

    const applicationId = await this.applicationMatcher.matchAndUpsert({
      userId,
      platformId,
      threadId: meta.threadId,
      messageId: meta.id,
      messageAt: meta.internalDate,
      appliedAt: application.appliedAt,
      companyName: application.company,
      role: application.role,
      companyId: discovered?.id,
      extractedDetails: {
        company: application.company,
        role: application.role,
        location: application.location,
        source: classificationSource === 'ai' ? 'ai' : 'rule',
      },
    });

    await this.applications.insertProcessedEmail({
      userId,
      messageId: meta.id,
      threadId: meta.threadId,
      platformId,
      subject: meta.subject,
      fromAddress: meta.from,
      internalDate: meta.internalDate,
      classificationStatus: 'applied',
      classificationSource,
      applicationId,
      syncPhase: 'platform',
    });

    return { aiCalls };
  }

  private async processLinkedInApplyEmail(
    userId: string,
    platformId: string,
    meta: {
      id: string;
      threadId: string;
      from: string;
      subject: string;
      internalDate: Date;
    },
    tokens: GmailTokens,
  ): Promise<{ aiCalls: number }> {
    this.cancellation.throwIfCancelled(userId);

    const content = await this.gmail.getMessageContent(meta.id, tokens);
    if (!content) {
      this.logger.warn(
        `[LinkedIn apply] failed to fetch message body messageId=${meta.id}`,
      );
    }

    const parsed = parseLinkedInApplyContent({
      subject: meta.subject,
      plainText: content?.plainText,
      html: content?.html,
      htmlAsText: content?.htmlAsText,
      messageDate: meta.internalDate,
    });
    let application = parsed.application;
    let aiCalls = 0;
    let classificationSource: 'rule' | 'ai' = 'rule';

    const bodyForAi =
      content?.plainText ?? content?.htmlAsText ?? content?.html ?? '';

    if (!application && bodyForAi.trim()) {
      this.cancellation.throwIfCancelled(userId);
      const aiResult = await this.aiClassifier.extractLinkedInApplyApplication({
        subject: meta.subject,
        body: bodyForAi,
        html: content?.html,
      });
      if (aiResult) {
        application = {
          ...aiResult,
          appliedAt: meta.internalDate,
        };
        aiCalls += 1;
        classificationSource = 'ai';
      }
    }

    if (!application) {
      await this.applications.insertProcessedEmail({
        userId,
        messageId: meta.id,
        threadId: meta.threadId,
        platformId,
        subject: meta.subject,
        fromAddress: meta.from,
        internalDate: meta.internalDate,
        classificationStatus: 'unknown',
        classificationSource: aiCalls > 0 ? 'ai' : 'rule',
        syncPhase: 'platform',
      });
      return { aiCalls };
    }

    const discovered = await this.companyDiscovery.upsertFromPlatformEmail({
      userId,
      companyName: application.company,
      platformId,
      fromAddress: meta.from,
      messageAt: meta.internalDate,
    });

    const applicationId = await this.applicationMatcher.matchAndUpsert({
      userId,
      platformId,
      threadId: meta.threadId,
      messageId: meta.id,
      messageAt: meta.internalDate,
      appliedAt: application.appliedAt,
      companyName: application.company,
      role: application.role,
      companyId: discovered?.id,
      extractedDetails: {
        company: application.company,
        role: application.role,
        location: application.location,
        source: classificationSource === 'ai' ? 'ai' : 'rule',
      },
    });

    await this.applications.insertProcessedEmail({
      userId,
      messageId: meta.id,
      threadId: meta.threadId,
      platformId,
      subject: meta.subject,
      fromAddress: meta.from,
      internalDate: meta.internalDate,
      classificationStatus: 'applied',
      classificationSource,
      applicationId,
      syncPhase: 'platform',
    });

    return { aiCalls };
  }
}
