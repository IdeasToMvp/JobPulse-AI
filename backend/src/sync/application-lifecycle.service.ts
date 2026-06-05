import { Injectable } from '@nestjs/common';
import { ApplicationRecord } from '../applications/application.entity';

export const GHOSTED_AFTER_DAYS = 50;

@Injectable()
export class ApplicationLifecycleService {
  findGhostedCandidates(
    applications: ApplicationRecord[],
    now: Date,
  ): string[] {
    const ids: string[] = [];
    for (const app of applications) {
      if (app.status !== 'applied') continue;
      if (!app.lastMessageAt) continue;
      const days =
        (now.getTime() - app.lastMessageAt.getTime()) / 86_400_000;
      if (days >= GHOSTED_AFTER_DAYS) {
        ids.push(app.id);
      }
    }
    return ids;
  }
}
