import { Module } from '@nestjs/common';

import { GmailModule } from 'src/modules/gmail/gmail.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TransactionsCron } from './tasks/transactions.cron';

@Module({
  imports: [GmailModule, PrismaModule],
  providers: [TransactionsService, TransactionsCron],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
