import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GmailService } from './gmail.service';

@Module({
  imports: [ConfigModule],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}
