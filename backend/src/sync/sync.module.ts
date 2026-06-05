import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApplicationsModule } from '../applications/applications.module';
import { GmailModule } from '../gmail/gmail.module';
import { UsersModule } from '../users/users.module';
import { AiClassifierService } from './ai-classifier.service';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { ApplicationMatcherService } from './application-matcher.service';
import { CompanyDiscoveryService } from './company-discovery.service';
import { RuleEngineService } from './rule-engine.service';
import { SyncCancellationService } from './sync-cancellation.service';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [UsersModule, AuthModule, GmailModule, ApplicationsModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncCancellationService,
    RuleEngineService,
    AiClassifierService,
    ApplicationLifecycleService,
    CompanyDiscoveryService,
    ApplicationMatcherService,
  ],
  exports: [SyncService],
})
export class SyncModule {}
