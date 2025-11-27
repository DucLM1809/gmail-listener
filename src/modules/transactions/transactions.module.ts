import { Module } from '@nestjs/common';

import { GmailModule } from 'src/modules/gmail/gmail.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TransactionsCron } from './tasks/transactions.cron';
import { TransactionRepository } from 'src/infrastructure/repositories/transaction.repository';

@Module({
  imports: [GmailModule, PrismaModule],
  providers: [
    TransactionsService,
    TransactionsCron,
    { provide: 'ITransactionRepository', useClass: TransactionRepository },
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
