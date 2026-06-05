import { Injectable } from '@nestjs/common';
import { SyncCancelledException } from './sync-cancelled.exception';

@Injectable()
export class SyncCancellationService {
  private readonly cancelledUsers = new Set<string>();

  beginSync(userId: string): void {
    this.cancelledUsers.delete(userId);
  }

  cancel(userId: string): void {
    this.cancelledUsers.add(userId);
  }

  isCancelled(userId: string): boolean {
    return this.cancelledUsers.has(userId);
  }

  throwIfCancelled(userId: string): void {
    if (this.isCancelled(userId)) {
      throw new SyncCancelledException();
    }
  }
}
