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

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return super.create(data);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return super.update(id, data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
