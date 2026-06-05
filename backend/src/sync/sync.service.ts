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
import { RunSyncDto } from './dto/run-sync.dto';
import {
  buildGmailQuery,
  formatIsoDate,
  matchesPlatform,
  resolveIncrementalFromDate,
  resolveSyncDateRange,
} from './platform-filters';
import { RuleEngineService } from './rule-engine.service';

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
  ) {}

  async runSync(userId: string, dto?: RunSyncDto): Promise<SyncResultResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const platformIds = await this.jobSources.getForUser(userId);
    if (platformIds.length === 0) {
      throw new BadRequestException('Select at least one job source before syncing');
    }

    const tokens = await this.users.getGoogleTokens(userId);
    const { fromDate, toDate } = resolveSyncDateRange(dto);
    const incrementalFrom = resolveIncrementalFromDate(
      user.lastGmailInternalDate,
      fromDate,
    );

    let newMessages = 0;
    let skippedProcessed = 0;
    let aiCalls = 0;
    let maxInternalDate: Date | undefined = user.lastGmailInternalDate;

    for (const platformId of platformIds) {
      const query = buildGmailQuery(
        platformId as JobPlatformId,
        incrementalFrom,
        toDate,
      );
      const messageIds = await this.gmail.listMessageIds(query, tokens);

      for (const messageId of messageIds) {
        if (await this.applications.isMessageProcessed(userId, messageId)) {
          skippedProcessed += 1;
          continue;
        }

        const meta = await this.gmail.getMessageMetadata(messageId, tokens);
        if (!meta) continue;

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

        if (ruleResult.confidence === 'none' || ruleResult.confidence === 'low') {
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

        if (status !== 'unknown') {
          applicationId = await this.upsertApplicationFromEmail({
            userId,
            platformId,
            threadId: meta.threadId,
            messageId: meta.id,
            messageAt: meta.internalDate,
            status,
            company,
            role,
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
        });
      }
    }

    const allApps = await this.applications.listAllApplications(userId);
    const ghostedIds = this.lifecycle.findGhostedCandidates(
      allApps,
      new Date(),
    );
    await this.applications.markApplicationsGhosted(ghostedIds);

    const now = new Date();
    await this.applications.updateUserSyncCursor(userId, {
      lastSyncedAt: now,
      lastGmailInternalDate: maxInternalDate,
      syncFromDate: fromDate,
      syncToDate: toDate,
    });

    const { totals, byPlatform } =
      await this.applications.recomputeAggregates(userId);

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
      },
      byPlatform,
    };
  }

  async finalizePartialSync(userId: string): Promise<SyncResultResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const now = new Date();
    const { totals, byPlatform } =
      await this.applications.recomputeAggregates(userId);

    const syncFromDate = user.syncFromDate ?? now;
    const syncToDate = user.syncToDate ?? now;

    await this.applications.updateUserSyncCursor(userId, {
      lastSyncedAt: now,
      lastGmailInternalDate: user.lastGmailInternalDate ?? undefined,
      syncFromDate,
      syncToDate,
    });

    return {
      ...totals,
      lastSyncedAt: now.toISOString(),
      hasSynced: true,
      scan: {
        fromDate: formatIsoDate(syncFromDate),
        toDate: formatIsoDate(syncToDate),
        newMessages: 0,
        skippedProcessed: 0,
        aiCalls: 0,
      },
      byPlatform,
    };
  }

  async clearUserData(userId: string): Promise<void> {
    try {
      await this.users.resetSyncData(userId);
    } catch (error) {
      this.logger.error(`clearUserData failed: ${error}`);
      throw new InternalServerErrorException('Failed to clear user data');
    }
  }

  private async upsertApplicationFromEmail(input: {
    userId: string;
    platformId: string;
    threadId: string;
    messageId: string;
    messageAt: Date;
    status: ApplicationStatus;
    company: string;
    role?: string;
  }): Promise<string> {
    const existing = await this.applications.getLatestApplicationForThread(
      input.userId,
      input.threadId,
    );

    if (!existing) {
      const created = await this.applications.createApplication({
        userId: input.userId,
        threadId: input.threadId,
        cycleIndex: 0,
        platformId: input.platformId,
        company: input.company,
        role: input.role,
        status: input.status,
        lastMessageId: input.messageId,
        lastMessageAt: input.messageAt,
      });
      return created.id;
    }

    if (
      this.lifecycle.shouldCreateNewCycle(
        existing,
        input.status,
        input.role,
        input.messageAt,
      )
    ) {
      const created = await this.applications.createApplication({
        userId: input.userId,
        threadId: input.threadId,
        cycleIndex: existing.cycleIndex + 1,
        platformId: input.platformId,
        company: input.company,
        role: input.role,
        status: input.status,
        lastMessageId: input.messageId,
        lastMessageAt: input.messageAt,
      });
      return created.id;
    }

    const nextStatus = this.lifecycle.resolveNextStatus(
      existing.status,
      input.status,
    );
    const updated = await this.applications.updateApplication(existing.id, {
      status: nextStatus,
      company: input.company || existing.company,
      role: input.role ?? existing.role,
      lastMessageId: input.messageId,
      lastMessageAt: input.messageAt,
    });
    return updated.id;
  }
}
