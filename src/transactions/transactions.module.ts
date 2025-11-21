import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { GmailService } from 'src/gmail/gmail.service';
import { TransactionsCron } from './transactions.cron';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [
    TransactionsService,
    GmailService,
    TransactionsCron,
    PrismaService,
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
