import { Module } from '@nestjs/common';
import { AdminApiKeyGuard } from './admin-api-key.guard';
import { AppReleaseController } from './app-release.controller';
import { AppReleaseService } from './app-release.service';

@Module({
  controllers: [AppReleaseController],
  providers: [AppReleaseService, AdminApiKeyGuard],
})
export class AppReleaseModule {}
