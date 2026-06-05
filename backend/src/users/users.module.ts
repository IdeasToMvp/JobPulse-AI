import { Module } from '@nestjs/common';
import { TokenEncryptionService } from '../common/crypto/token-encryption.service';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, TokenEncryptionService],
  exports: [UsersService],
})
export class UsersModule {}
