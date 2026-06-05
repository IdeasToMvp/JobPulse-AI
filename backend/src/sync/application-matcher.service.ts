import { Injectable } from '@nestjs/common';
import {
  ApplicationRecord,
  ApplicationStatus,
} from '../applications/application.entity';
import { ApplicationsService } from '../applications/applications.service';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { rolesOverlap } from './company-name.util';

export interface MatchEmailInput {
  userId: string;
  threadId: string;
  messageId: string;
  messageAt: Date;
  platformId: string;
  companyId?: string;
  companyName: string;
  role?: string;
  status: ApplicationStatus;
}

@Injectable()
export class ApplicationMatcherService {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly lifecycle: ApplicationLifecycleService,
  ) {}

  async matchAndUpsert(input: MatchEmailInput): Promise<string> {
    const byThread = await this.applications.getLatestApplicationForThread(
      input.userId,
      input.threadId,
    );

    if (byThread) {
      return this.updateExisting(byThread, input);
    }

    if (input.companyId) {
      const byCompany = await this.applications.getLatestApplicationForCompany(
        input.userId,
        input.companyId,
      );

      if (byCompany && rolesOverlap(byCompany.role, input.role)) {
        return this.updateExisting(byCompany, input);
      }
    }

    const byName =
      await this.applications.getLatestApplicationForCompanyNameAndRole(
        input.userId,
        input.companyName,
        input.role,
      );

    if (byName) {
      return this.updateExisting(byName, input);
    }

    const created = await this.applications.createApplication({
      userId: input.userId,
      threadId: input.threadId,
      cycleIndex: 0,
      platformId: input.platformId,
      company: input.companyName,
      companyId: input.companyId,
      role: input.role,
      status: input.status,
      lastMessageId: input.messageId,
      lastMessageAt: input.messageAt,
    });
    return created.id;
  }

  private async updateExisting(
    existing: ApplicationRecord,
    input: MatchEmailInput,
  ): Promise<string> {
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
        platformId: existing.platformId,
        company: input.companyName || existing.company,
        companyId: input.companyId,
        role: input.role ?? existing.role,
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
      company: input.companyName || existing.company,
      role: input.role ?? existing.role,
      lastMessageId: input.messageId,
      lastMessageAt: input.messageAt,
      companyId: input.companyId,
    });
    return updated.id;
  }
}
