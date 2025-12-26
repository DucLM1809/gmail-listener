import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { Result } from 'src/core/result';
import { PageMetaDto } from '../../../core/dto/page-meta.dto';
import { PageOptionsDto } from '../../../core/dto/page-options.dto';
import { PageDto } from '../../../core/dto/page.dto';
import { IAccountRepository } from '../../../domain/repositories/account.repository.interface';
import { AccountResponseDto } from '../dto/account-response.dto';
import { Role } from '../../auth/enums/role.enum';
import { AccountNotFoundException } from '../exceptions/account.exceptions';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
  ) {}

  async create(createAccountDto: CreateAccountDto, userId: string) {
    const account = await this.accountRepository.create({
      ...createAccountDto,
      initialBalance: createAccountDto.initialBalance ?? 0,
      currentBalance: createAccountDto.currentBalance ?? 0,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return Result.ok(account);
  }

  async findAll(
    pageOptionsDto: PageOptionsDto,
    userId: string,
    targetUserId?: string,
  ): Promise<Result<PageDto<AccountResponseDto>>> {
    const { skip, take, order } = pageOptionsDto;

    const where: Prisma.AccountWhereInput = {
      userId: targetUserId || userId,
      deletedAt: null,
    };

    const [accounts, itemCount] = await Promise.all([
      this.accountRepository.findAll({
        skip,
        take,
        where,
        orderBy: {
          createdAt: order,
        },
        select: {
          id: true,
          name: true,
          type: true,
          initialBalance: true,
          currentBalance: true,
          createdAt: true,
        },
      }),
      this.accountRepository.count({
        where,
      }),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return Result.ok(
      new PageDto(accounts as unknown as AccountResponseDto[], pageMetaDto),
    );
  }

  async findOne(id: string, userId: string, role: Role) {
    const account = await this.accountRepository.findOne(id);

    if (!account) {
      return Result.fail(new AccountNotFoundException());
    }

    if (role !== Role.Admin && account.userId !== userId) {
      return Result.fail(new AccountNotFoundException());
    }

    return Result.ok(account);
  }

  async getStats(userId: string) {
    const [totalInitialBalance, totalCurrentBalance, accountsByType] =
      await Promise.all([
        this.accountRepository.aggregate({
          where: {
            userId,
            deletedAt: null,
          },
          _sum: {
            initialBalance: true,
          },
        }),
        this.accountRepository.aggregate({
          where: {
            userId,
            deletedAt: null,
          },
          _sum: {
            currentBalance: true,
          },
        }),
        this.accountRepository.groupBy({
          where: {
            userId,
            deletedAt: null,
          },
          by: ['type'],
          _count: {
            id: true,
          },
        }),
      ]);

    return Result.ok({
      totalInitialBalance: totalInitialBalance._sum.initialBalance,
      totalCurrentBalance: totalCurrentBalance._sum.currentBalance,
      accountsByType,
    });
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    userId: string,
    role: Role,
  ) {
    const account = await this.accountRepository.findOne(id);

    if (
      !account ||
      (role !== Role.Admin && account.userId !== userId) ||
      account.deletedAt
    ) {
      return Result.fail(new AccountNotFoundException());
    }

    const updatedAccount = await this.accountRepository.update(
      id,
      updateAccountDto,
    );
    return Result.ok(updatedAccount);
  }

  async remove(id: string, userId: string, role: Role) {
    const account = await this.accountRepository.findOne(id);
    if (
      !account ||
      (role !== Role.Admin && account.userId !== userId) ||
      account.deletedAt
    ) {
      return Result.fail(new AccountNotFoundException());
    }

    // Soft delete
    await this.accountRepository.update(id, { deletedAt: new Date() });
    return Result.ok(true);
  }
}
