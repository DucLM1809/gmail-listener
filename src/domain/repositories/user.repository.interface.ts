import { User } from 'generated/prisma/client';
import { IGenericRepository } from './generic.repository';

export interface IUserRepository extends IGenericRepository<User> {
  findByEmail(email: string): Promise<User | null>;
}
