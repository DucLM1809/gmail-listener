import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { TransactionsService } from '../services/transactions.service';

@Injectable()
export class TransactionsCron {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Update the cron expression to run at 11:59 PM
  @Cron('59 23 * * *')
  async handleCron() {
    console.log('Cron: fetching VCB Gmail transactions at 11:59 PM...');
    await this.transactionsService.getTodayVcbTransactions();
  }
}
