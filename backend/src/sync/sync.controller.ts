import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FinalizeSyncDto } from './dto/finalize-sync.dto';
import { RunSyncDto } from './dto/run-sync.dto';
import { SyncCancellationService } from './sync-cancellation.service';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(
    private readonly sync: SyncService,
    private readonly cancellation: SyncCancellationService,
  ) {}

  @Post('begin')
  @HttpCode(200)
  begin(@Req() req: AuthenticatedRequest) {
    this.cancellation.beginSync(req.user!.sub);
    return { ok: true };
  }

  @Post('cancel')
  @HttpCode(200)
  cancel(@Req() req: AuthenticatedRequest) {
    this.cancellation.cancel(req.user!.sub);
    return { ok: true };
  }

  @Post()
  @HttpCode(200)
  runSync(@Req() req: AuthenticatedRequest, @Body() body: RunSyncDto) {
    const userId = req.user!.sub;
    return this.runWithCancellation(req, userId, () =>
      this.sync.runSync(userId, body),
    );
  }

  @Post('platform')
  @HttpCode(200)
  runPlatformDiscovery(
    @Req() req: AuthenticatedRequest,
    @Body() body: RunSyncDto,
  ) {
    const userId = req.user!.sub;
    return this.runWithCancellation(req, userId, () =>
      this.sync.runPlatformDiscovery(userId, body),
    );
  }

  @Post('companies')
  @HttpCode(200)
  runCompanyDiscovery(
    @Req() req: AuthenticatedRequest,
    @Body() body: RunSyncDto,
  ) {
    const userId = req.user!.sub;
    return this.runWithCancellation(req, userId, () =>
      this.sync.runCompanyDiscovery(userId, body),
    );
  }

  @Post('finalize')
  @HttpCode(200)
  finalize(@Req() req: AuthenticatedRequest, @Body() body: FinalizeSyncDto) {
    return this.sync.finalizeSync(req.user!.sub, body);
  }

  private runWithCancellation<T>(
    req: AuthenticatedRequest,
    userId: string,
    run: () => Promise<T>,
  ): Promise<T> {
    const onClose = () => this.cancellation.cancel(userId);
    req.on('close', onClose);

    return run().finally(() => {
      req.off('close', onClose);
    });
  }
}
