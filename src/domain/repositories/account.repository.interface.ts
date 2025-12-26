import { Account, Prisma } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface IAccountRepository extends IGenericRepository<Account> {
  findAll(params?: Prisma.AccountFindManyArgs): Prisma.PrismaPromise<Account[]>;
  count(params?: Prisma.AccountCountArgs): Prisma.PrismaPromise<number>;
  create(data: Prisma.AccountCreateInput): Prisma.PrismaPromise<Account>;
  update(
    id: string,
    data: Prisma.AccountUpdateInput,
  ): Prisma.PrismaPromise<Account>;
  aggregate<T extends Prisma.AccountAggregateArgs>(
    args: T,
  ): Prisma.PrismaPromise<Prisma.GetAccountAggregateType<T>>;
  groupBy<T extends Prisma.AccountGroupByArgs>(
    args: Prisma.SelectSubset<T, Prisma.AccountGroupByArgs>,
  ): Prisma.PrismaPromise<Array<any>>;
}
