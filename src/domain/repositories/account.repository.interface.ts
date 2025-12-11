import { Account, Prisma } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface IAccountRepository extends IGenericRepository<Account> {
  findAll(params?: Prisma.AccountFindManyArgs): Promise<Account[]>;
  count(params?: Prisma.AccountCountArgs): Promise<number>;
  create(data: Prisma.AccountCreateInput): Promise<Account>;
  update(id: string, data: Prisma.AccountUpdateInput): Promise<Account>;
}
