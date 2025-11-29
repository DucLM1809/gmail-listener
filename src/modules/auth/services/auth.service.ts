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
import { ForbiddenException } from '@nestjs/common';

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

    return this.getTokens(user.id, user.email);
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

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return Result.ok(tokens);
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

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return Result.ok(tokens);
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<Result<TokenResponse>> {
    const user = await this.userRepository.findOne(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return Result.ok(tokens);
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, {
      hashedRefreshToken,
    });
  }

  private async getTokens(
    userId: string,
    email: string,
  ): Promise<TokenResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: ' your_jwt_secret', // TODO: Move to env
          expiresIn: '15m',
        },
      ),
      this.jwt.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: ' your_jwt_secret', // TODO: Move to env
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
