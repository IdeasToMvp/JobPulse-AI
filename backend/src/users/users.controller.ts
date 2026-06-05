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
import { UpdateJobSourcesDto } from './dto/update-job-sources.dto';
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

  @Post('data/clear')
  @HttpCode(200)
  async clearData(@Req() req: AuthenticatedRequest) {
    await this.users.resetSyncData(req.user!.sub);
    const profile = await this.users.getProfile(req.user!.sub);
    return { user: profile };
  }
}
