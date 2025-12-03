import { Prisma, User } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface IUserRepository
  extends Omit<IGenericRepository<User>, 'create' | 'update'> {
  findByEmail(email: string): Promise<User | null>;
  create(data: Prisma.UserCreateInput): Promise<User>;
  update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
}
