import { Inject, Injectable } from '@nestjs/common';
import { Prisma, User } from 'generated/prisma/client';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne(id);
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.userRepository.update(id, data);
  }

  async delete(id: string): Promise<User> {
    return this.userRepository.delete(id);
  }
}
