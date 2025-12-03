import { Controller, Get } from '@nestjs/common';

import { TransactionsService } from '../services/transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('vcb/today')
  async getTodayTransactions() {
    const vcbTransactions =
      await this.transactionsService.getTodayVcbTransactions();
    const vcbDigitalTransactions =
      await this.transactionsService.getTodayVcbDigitalTransactions();

    const data = [...vcbTransactions, ...vcbDigitalTransactions];

    return {
      count: data.length,
      data,
    };
  }
}
