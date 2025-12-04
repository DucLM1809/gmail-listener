import { Inject, Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { Result } from 'src/core/result';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserNotFoundException } from '../exceptions/user.exceptions';

@Injectable()
export class UserService {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
  ) {}

  async findAll(): Promise<Result<User[]>> {
    const users = await this.userRepository.findAll();
    return Result.ok(users);
  }

  async findOne(id: string): Promise<Result<User>> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      return Result.fail(new UserNotFoundException());
    }
    return Result.ok(user);
  }

  async update(id: string, data: UpdateUserDto): Promise<Result<User>> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      return Result.fail(new UserNotFoundException());
    }
    const updatedUser = await this.userRepository.update(id, data);
    return Result.ok(updatedUser);
  }

  async delete(id: string): Promise<Result<User>> {
    const user = await this.userRepository.findOne(id);
    if (!user) {
      return Result.fail(new UserNotFoundException());
    }
    const deletedUser = await this.userRepository.delete(id);
    return Result.ok(deletedUser);
  }
}
