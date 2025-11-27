import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { GoogleUserDto } from '../dto/google-user.dto';
import { TokenResponse } from '../interfaces/token.response';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { Result } from 'src/core/result';
import {
  UserAlreadyExistsException,
  InvalidCredentialsException,
} from '../exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @Inject('IUserRepository') private userRepository: IUserRepository,
  ) {}

  async loginWithGoogle(googleUser: GoogleUserDto) {
    let user = await this.userRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await this.userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        accessToken: googleUser.accessToken,
        refreshToken: googleUser.refreshToken,
      });
    } else {
      await this.userRepository.update(user.id, {
        accessToken: googleUser.accessToken,
        refreshToken: googleUser.refreshToken,
      });
    }

    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto): Promise<Result<TokenResponse>> {
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      return Result.fail(new UserAlreadyExistsException());
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.userRepository.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
    });

    return Result.ok(this.generateToken(user));
  }

  async login(loginDto: LoginDto): Promise<Result<TokenResponse>> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user || !user.password) {
      return Result.fail(new InvalidCredentialsException());
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      return Result.fail(new InvalidCredentialsException());
    }

    return Result.ok(this.generateToken(user));
  }

  private generateToken(user: User): TokenResponse {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwt.sign(payload),
    };
  }
}
