import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GmailController } from './controllers/gmail.controller';
import { GmailService } from './services/gmail.service';
import { TransactionsCron } from './tasks/transaction.cron';

@Module({
  imports: [PrismaModule],
  controllers: [GmailController],
  providers: [GmailService, TransactionsCron],
  exports: [GmailService],
})
export class GmailModule {}
