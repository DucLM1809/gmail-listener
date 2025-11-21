import { Module } from '@nestjs/common';
import { GmailController } from './gmail.controller';
import { GmailService } from './gmail.service';
import { TransactionsCron } from './transaction.cron';

@Module({
  controllers: [GmailController],
  providers: [GmailService, TransactionsCron],
})
export class GmailModule {}
