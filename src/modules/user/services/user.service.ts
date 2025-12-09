import { Inject, Injectable } from '@nestjs/common';
import { Prisma, User } from 'generated/prisma/client';
import { Result } from 'src/core/result';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserNotFoundException } from '../exceptions/user.exceptions';

import { PageDto } from 'src/core/dto/page.dto';
import { PageMetaDto } from 'src/core/dto/page-meta.dto';
import { PageOptionsDto } from 'src/core/dto/page-options.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';
import { Role } from 'src/modules/auth/enums/role.enum';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    private readonly prismaService: PrismaService,
  ) {}

  async findAll(
    pageOptionsDto: PageOptionsDto,
  ): Promise<Result<PageDto<UserResponseDto>>> {
    const where: Prisma.UserWhereInput = {
      role: {
        not: Role.Admin,
      },
      ...(pageOptionsDto.q && {
        OR: [
          {
            email: {
              contains: pageOptionsDto.q,
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: pageOptionsDto.q,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [users, itemCount] = await this.prismaService.$transaction([
      this.userRepository.findAll({
        skip: pageOptionsDto.skip,
        take: pageOptionsDto.take,
        orderBy: {
          createdAt: pageOptionsDto.order === 'ASC' ? 'asc' : 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        where,
      }),
      this.userRepository.count({
        where,
      }),
    ]);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    const userDtos = users.map(UserMapper.toDto);

    return Result.ok(new PageDto(userDtos, pageMetaDto));
  }

  async findAllRawQuery(
    pageOptionsDto: PageOptionsDto,
  ): Promise<Result<PageDto<UserResponseDto>>> {
    const [users, totalResult] = await Promise.all([
      this.prismaService.$queryRaw<User[]>`
      SELECT id, email, name, picture, role, created_at, updated_at
      FROM "User"
      WHERE role = ${Role.User}
      ${
        pageOptionsDto.q
          ? Prisma.sql`AND (email ILIKE ${`%${pageOptionsDto.q}%`} OR name ILIKE ${`%${pageOptionsDto.q}%`})`
          : Prisma.empty
      }
      ORDER BY "createdAt" DESC
      LIMIT ${pageOptionsDto.take} OFFSET ${pageOptionsDto.skip}
    `,
      this.prismaService.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count
      FROM "User"
      WHERE role = ${Role.User}
      ${
        pageOptionsDto.q
          ? Prisma.sql`AND (email ILIKE ${`%${pageOptionsDto.q}%`} OR name ILIKE ${`%${pageOptionsDto.q}%`})`
          : Prisma.empty
      }
    `,
    ]);

    const itemCount = Number(totalResult[0]?.count || 0);

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    const userDtos = users.map(UserMapper.toDto);

    return Result.ok(new PageDto(userDtos, pageMetaDto));
  }

  async findOne(id: string): Promise<Result<UserResponseDto>> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      return Result.fail(new UserNotFoundException());
    }

    const userDtos = UserMapper.toDto(user);

    return Result.ok(userDtos);
  }

  async update(id: string, data: UpdateUserDto): Promise<Result<User>> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      return Result.fail(new UserNotFoundException());
    }

    const updatedUser = await this.userRepository.update(id, data);

    return Result.ok(updatedUser);
  }

  async delete(id: string): Promise<Result<boolean>> {
    const user = await this.userRepository.findOne(id);

    if (!user) {
      return Result.fail(new UserNotFoundException());
    }

    await this.userRepository.delete(id);

    return Result.ok(true);
  }
}
