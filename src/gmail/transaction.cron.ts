import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GmailService } from './gmail.service';

@Injectable()
export class TransactionsCron {
  constructor(private gmail: GmailService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    console.log('Running VCB Gmail Cron...');
    const txs = await this.gmail.getVcbTransactionsToday();
    console.log('VCB TX:', txs);
  }
}
