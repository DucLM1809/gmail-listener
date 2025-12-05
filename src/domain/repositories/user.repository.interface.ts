import { Prisma, User } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface IUserRepository
  extends Omit<IGenericRepository<User>, 'create' | 'update'> {
  findAll(params?: Prisma.UserFindManyArgs): Prisma.PrismaPromise<User[]>;
  count(params?: Prisma.UserCountArgs): Prisma.PrismaPromise<number>;
  findByEmail(email: string): Prisma.PrismaPromise<User | null>;
  create(data: Prisma.UserCreateInput): Prisma.PrismaPromise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Prisma.PrismaPromise<User>;
}
