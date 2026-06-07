import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from '../activities/activities.service';
import { ApplicationsService } from './applications.service';
import { CreateManualApplicationDto } from './dto/create-manual-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UpdateApplicationDetailsDto } from './dto/update-application-details.dto';

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

  @Post()
  @HttpCode(200)
  async createManual(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateManualApplicationDto,
  ) {
    const userId = req.user!.sub;
    const result = await this.applications.createManualApplication(
      userId,
      body,
    );
    const appliedAt = new Date(body.appliedAt);

    await this.activities.recordManualApplication({
      userId,
      applicationId: result.application.id,
      company: result.application.company,
      role: result.application.role ?? body.role,
      platformId: result.application.platformId,
      status: body.status,
      occurredAt: Number.isNaN(appliedAt.getTime()) ? new Date() : appliedAt,
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
      body.details,
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

  @Patch(':id/details')
  async updateDetails(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateApplicationDetailsDto,
  ) {
    const application = await this.applications.updateUserDetailsManually(
      req.user!.sub,
      id,
      body.details,
      body.role,
    );

    return { application };
  }
}
