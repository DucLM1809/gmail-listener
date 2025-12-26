import { Injectable } from '@nestjs/common';
import { Account, Prisma } from 'generated/prisma/client';
import { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaGenericRepository } from './prisma-generic.repository';

@Injectable()
export class AccountRepository
  extends PrismaGenericRepository<Account>
  implements IAccountRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'account');
  }
  create(data: Prisma.AccountCreateInput): Prisma.PrismaPromise<Account> {
    return super.create(data);
  }

  update(
    id: string,
    data: Prisma.AccountUpdateInput,
  ): Prisma.PrismaPromise<Account> {
    return super.update(id, data);
  }

  aggregate<T extends Prisma.AccountAggregateArgs>(
    args: T,
  ): Prisma.PrismaPromise<Prisma.GetAccountAggregateType<T>> {
    return this.prisma.account.aggregate(args);
  }

  groupBy<T extends Prisma.AccountGroupByArgs>(
    args: Prisma.SelectSubset<T, Prisma.AccountGroupByArgs>,
  ): Prisma.PrismaPromise<Array<any>> {
    return (this.prisma.account.groupBy as any)(args);
  }
}
