import { Transaction } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface ITransactionRepository
  extends IGenericRepository<Transaction> {
  findByMessageId(messageId: string): Promise<Transaction | null>;
}
