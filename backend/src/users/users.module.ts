import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TokenEncryptionService } from '../common/crypto/token-encryption.service';
import { JobSourcesService } from './job-sources.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, JobSourcesService, TokenEncryptionService],
  exports: [UsersService, JobSourcesService],
})
export class UsersModule {}
