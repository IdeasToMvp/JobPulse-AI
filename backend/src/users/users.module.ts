import { Module } from '@nestjs/common';
import { TokenEncryptionService } from '../common/crypto/token-encryption.service';
import { JobSourcesService } from './job-sources.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, JobSourcesService, TokenEncryptionService],
  exports: [UsersService, JobSourcesService],
})
export class UsersModule {}
