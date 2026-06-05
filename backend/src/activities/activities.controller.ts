import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { ListActivitiesDto } from './dto/list-activities.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get()
  list(@Req() req: AuthenticatedRequest, @Query() query: ListActivitiesDto) {
    return this.activities.listActivities(req.user!.sub, {
      type: query.type,
      offset: query.offset,
      limit: query.limit,
    });
  }
}
