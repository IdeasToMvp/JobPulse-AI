import { Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly sync: SyncService) {}

  @Post()
  @HttpCode(200)
  runSync(@Req() req: AuthenticatedRequest) {
    return this.sync.runSync(req.user!.sub);
  }
}
