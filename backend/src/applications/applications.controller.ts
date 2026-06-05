import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Req,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from '../activities/activities.service';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(
    private readonly applications: ApplicationsService,
    @Inject(forwardRef(() => ActivitiesService))
    private readonly activities: ActivitiesService,
  ) {}

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.applications.listApplications(req.user!.sub);
  }

  @Get(':id')
  getOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.applications.getApplicationDetail(req.user!.sub, id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateApplicationStatusDto,
  ) {
    const userId = req.user!.sub;
    const result = await this.applications.updateStatusManually(
      userId,
      id,
      body.status,
    );

    await this.activities.recordStatusUpdate({
      userId,
      applicationId: id,
      company: result.application.company,
      role: result.application.role,
      previousStatus: result.previousStatus,
      newStatus: body.status,
      platformId: result.application.platformId,
      occurredAt: new Date(),
    });

    return {
      application: result.application,
      sync: {
        lastSyncedAt: result.lastSyncedAt,
        emailsProcessed: result.totals.emailsProcessed,
        applicationsCount: result.totals.applicationsCount,
        appliedCount: result.totals.appliedCount,
        activeCount: result.totals.activeCount,
        interviewsCount: result.totals.interviewsCount,
        offersCount: result.totals.offersCount,
        rejectedCount: result.totals.rejectedCount,
        ghostedCount: result.totals.ghostedCount,
        hasSynced: result.lastSyncedAt != null,
      },
    };
  }
}
