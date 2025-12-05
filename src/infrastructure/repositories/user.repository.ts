import { Injectable } from '@nestjs/common';
import { Prisma, User } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaGenericRepository } from './prisma-generic.repository';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UserRepository
  extends PrismaGenericRepository<User>
  implements IUserRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  create(data: Prisma.UserCreateInput): Prisma.PrismaPromise<User> {
    return super.create(data);
  }

  update(id: string, data: Prisma.UserUpdateInput): Prisma.PrismaPromise<User> {
    return super.update(id, data);
  }

  findByEmail(email: string): Prisma.PrismaPromise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
