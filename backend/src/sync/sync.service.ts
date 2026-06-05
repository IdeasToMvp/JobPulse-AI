import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(private readonly users: UsersService) {}

  /**
   * Placeholder sync until Gmail parsing is implemented.
   * Marks sync complete and returns current DB counts.
   */
  async runSync(userId: string) {
    const now = new Date().toISOString();
    await this.users.updateSyncTimestamp(userId, now);

    const profile = await this.users.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return profile.sync;
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
