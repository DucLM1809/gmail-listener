import { Controller, Get } from '@nestjs/common';
import { GmailTransactionsService } from './gmail-transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly gmailService: GmailTransactionsService) {}

  @Get('vcb/today')
  async getTodayTransactions() {
    const vcbTransactions = await this.gmailService.getTodayVcbTransactions();

    const vcbDigitalTransactions =
      await this.gmailService.getTodayVcbDigitalTransactions();

    const data = [...vcbTransactions, ...vcbDigitalTransactions];

    return {
      count: data.length,
      data,
    };
  }
}
