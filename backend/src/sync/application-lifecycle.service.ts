import { Injectable } from '@nestjs/common';
import {
  ApplicationRecord,
  ApplicationStatus,
} from '../applications/application.entity';

export const REAPPLY_GAP_DAYS = 45;
export const GHOSTED_AFTER_DAYS = 21;

const STATUS_RANK: Record<ApplicationStatus, number> = {
  applied: 1,
  active: 2,
  interview: 3,
  offer: 4,
  rejected: 5,
  ghosted: 5,
  unknown: 0,
};

const TERMINAL_STATUSES: ApplicationStatus[] = [
  'rejected',
  'ghosted',
  'offer',
];

@Injectable()
export class ApplicationLifecycleService {
  shouldCreateNewCycle(
    existing: ApplicationRecord,
    incomingStatus: ApplicationStatus | 'unknown',
    incomingRole: string | undefined,
    messageAt: Date,
  ): boolean {
    if (incomingStatus === 'unknown') return false;

    const roleChanged =
      !!incomingRole &&
      !!existing.role &&
      this.normalizeRole(incomingRole) !== this.normalizeRole(existing.role);

    if (roleChanged) return true;

    const isTerminal = TERMINAL_STATUSES.includes(existing.status);
    const isReapply = incomingStatus === 'applied';
    const daysSince = existing.lastMessageAt
      ? (messageAt.getTime() - existing.lastMessageAt.getTime()) / 86_400_000
      : REAPPLY_GAP_DAYS + 1;

    return isTerminal && isReapply && daysSince > REAPPLY_GAP_DAYS;
  }

  resolveNextStatus(
    current: ApplicationStatus,
    incoming: ApplicationStatus | 'unknown',
  ): ApplicationStatus {
    if (incoming === 'unknown') return current;
    if (incoming === 'rejected') return 'rejected';

    const currentRank = STATUS_RANK[current] ?? 0;
    const incomingRank = STATUS_RANK[incoming] ?? 0;

    if (incomingRank > currentRank) return incoming;
    return current;
  }

  findGhostedCandidates(
    applications: ApplicationRecord[],
    now: Date,
  ): string[] {
    const ids: string[] = [];
    for (const app of applications) {
      if (app.status !== 'applied' && app.status !== 'active') continue;
      if (!app.lastMessageAt) continue;
      const days =
        (now.getTime() - app.lastMessageAt.getTime()) / 86_400_000;
      if (days >= GHOSTED_AFTER_DAYS) {
        ids.push(app.id);
      }
    }
    return ids;
  }

  normalizeRole(role: string): string {
    return role.toLowerCase().replace(/\s+/g, ' ').trim();
  }
}
