import { Injectable } from '@nestjs/common';
import {
  ApplicationRecord,
  ApplicationExtractedDetails,
} from '../applications/application.entity';
import { ActivitiesService } from '../activities/activities.service';
import { ApplicationsService } from '../applications/applications.service';

export interface MatchEmailInput {
  userId: string;
  threadId: string;
  messageId: string;
  messageAt: Date;
  appliedAt?: Date;
  platformId: string;
  companyId?: string;
  companyName: string;
  role?: string;
  extractedDetails?: ApplicationExtractedDetails;
}

@Injectable()
export class ApplicationMatcherService {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly activities: ActivitiesService,
  ) {}

  async matchAndUpsert(input: MatchEmailInput): Promise<string> {
    const byThread = await this.applications.getLatestApplicationForThread(
      input.userId,
      input.threadId,
    );

    if (byThread) {
      await this.applications.touchApplicationMessage(byThread.id, {
        lastMessageId: input.messageId,
        lastMessageAt: input.messageAt,
      });
      return byThread.id;
    }

    const created = await this.applications.createApplication({
      userId: input.userId,
      threadId: input.threadId,
      cycleIndex: 0,
      platformId: input.platformId,
      company: input.companyName,
      companyId: input.companyId,
      role: input.role,
      status: 'applied',
      lastMessageId: input.messageId,
      lastMessageAt: input.messageAt,
      appliedAt: input.appliedAt,
      extractedDetails: input.extractedDetails,
    });

    await this.activities.recordApplicationDetected({
      userId: input.userId,
      applicationId: created.id,
      company: created.company,
      role: created.role,
      platformId: input.platformId,
      occurredAt: input.messageAt,
    });

    await this.applications.appendStatusHistory({
      userId: input.userId,
      applicationId: created.id,
      status: 'applied',
      source: 'sync',
      changedAt: input.appliedAt ?? input.messageAt,
    });

    return created.id;
  }
}
