import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';
import { SyncCancellationService } from './sync-cancellation.service';
import { SyncService } from './sync.service';

@Injectable()
export class AutoSyncCronService {
  private readonly logger = new Logger(AutoSyncCronService.name);
  private readonly running = new Set<string>();

  constructor(
    private readonly users: UsersService,
    private readonly sync: SyncService,
    private readonly cancellation: SyncCancellationService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async pollDueUsers(): Promise<void> {
    if (!this.config.get<boolean>('autoSync.enabled')) return;

    const dueUsers = await this.users.listUsersDueForAutoSync();

    for (const user of dueUsers) {
      if (this.running.has(user.id)) continue;
      if (this.cancellation.isSyncActive(user.id)) continue;

      this.running.add(user.id);
      try {
        this.logger.log(`Running auto sync for ${user.email}`);
        await this.sync.runAutoSync(user.id);
      } catch (error) {
        this.logger.error(`Auto sync failed for ${user.id}: ${error}`);
      } finally {
        this.running.delete(user.id);
      }
    }
  }
}
