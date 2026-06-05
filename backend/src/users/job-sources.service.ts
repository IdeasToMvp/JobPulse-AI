import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { assertValidPlatformIds } from './job-platforms';

@Injectable()
export class JobSourcesService {
  private readonly logger = new Logger(JobSourcesService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async getForUser(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase.db
      .from('user_job_sources')
      .select('platform_id')
      .eq('user_id', userId)
      .order('platform_id');

    if (error) this.raise('getForUser', error);
    return (data ?? []).map((row) => row.platform_id as string);
  }

  async replaceForUser(userId: string, platformIds: string[]): Promise<string[]> {
    assertValidPlatformIds(platformIds);

    const unique = [...new Set(platformIds)];
    if (unique.length === 0) {
      throw new BadRequestException('Select at least one job source');
    }

    const { error: deleteError } = await this.supabase.db
      .from('user_job_sources')
      .delete()
      .eq('user_id', userId);

    if (deleteError) this.raise('replaceForUser.delete', deleteError);

    const rows = unique.map((platformId) => ({
      user_id: userId,
      platform_id: platformId,
    }));

    const { error: insertError } = await this.supabase.db
      .from('user_job_sources')
      .insert(rows);

    if (insertError) this.raise('replaceForUser.insert', insertError);

    return unique;
  }

  private raise(operation: string, error: { message: string }): never {
    this.logger.error(`${operation} failed: ${error.message}`);
    throw new InternalServerErrorException('Database operation failed');
  }
}
