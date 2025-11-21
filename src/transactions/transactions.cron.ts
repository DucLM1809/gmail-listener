import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransactionsCron {
  constructor(private readonly gmailService: TransactionsService) {}

  // Update the cron expression to run at 11:59 PM
  @Cron('59 23 * * *')
  async handleCron() {
    console.log('Cron: fetching VCB Gmail transactions at 11:59 PM...');
    await this.gmailService.getTodayVcbTransactions();
  }
}
