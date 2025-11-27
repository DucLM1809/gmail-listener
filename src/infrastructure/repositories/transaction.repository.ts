import { Injectable } from '@nestjs/common';
import { Transaction } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaGenericRepository } from './prisma-generic.repository';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';

@Injectable()
export class TransactionRepository
  extends PrismaGenericRepository<Transaction>
  implements ITransactionRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'transaction');
  }

  async findByMessageId(messageId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: { messageId },
    });
  }
}
