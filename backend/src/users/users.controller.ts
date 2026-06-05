import {
  Body,
  Controller,
  HttpCode,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SetupNewOnlySyncDto } from './dto/setup-new-only-sync.dto';
import { UpdateJobSourcesDto } from './dto/update-job-sources.dto';
import { UpdateSyncSettingsDto } from './dto/update-sync-settings.dto';
import { JobSourcesService } from './job-sources.service';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly jobSources: JobSourcesService,
  ) {}

  @Put('job-sources')
  async updateJobSources(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateJobSourcesDto,
  ) {
    const platformIds = await this.jobSources.replaceForUser(
      req.user!.sub,
      body.platformIds,
    );
    const profile = await this.users.getProfile(req.user!.sub);
    return { jobSources: platformIds, user: profile };
  }

  @Put('sync-settings')
  async updateSyncSettings(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateSyncSettingsDto,
  ) {
    const profile = await this.users.updateSyncSettings(req.user!.sub, {
      autoSyncEnabled: body.autoSyncEnabled,
      syncFrequencyMinutes: body.syncFrequencyMinutes,
    });
    return { user: profile };
  }

  @Post('initial-sync/new-only')
  @HttpCode(200)
  async setupNewOnlySync(
    @Req() req: AuthenticatedRequest,
    @Body() body: SetupNewOnlySyncDto,
  ) {
    const profile = await this.users.setupNewOnlyTracking(
      req.user!.sub,
      body.platformIds,
    );
    return { user: profile };
  }

  @Post('initial-sync/import-history')
  @HttpCode(200)
  async markImportHistory(@Req() req: AuthenticatedRequest) {
    await this.users.markImportHistoryMode(req.user!.sub);
    return { ok: true };
  }

  @Post('data/clear')
  @HttpCode(200)
  async clearData(@Req() req: AuthenticatedRequest) {
    await this.users.resetSyncData(req.user!.sub);
    const profile = await this.users.getProfile(req.user!.sub);
    return { user: profile };
  }
}
