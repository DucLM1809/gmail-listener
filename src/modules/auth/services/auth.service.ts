import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { google } from 'googleapis';
import { Result } from 'src/core/result';
import { AppLoggerService } from 'src/core/services/app-logger.service';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { GoogleUserDto } from '../dto/auth/google-user.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterResponseDto } from '../dto/auth/register-response.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import {
  InvalidCredentialsException,
  UserAlreadyExistsException,
} from '../exceptions/auth.exceptions';
import { LoginResponse, TokenResponse } from '../interfaces/token.response';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { TwoFactorGenerateResponseDto } from '../dto/auth/two-factor-generate-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @Inject('IUserRepository') private userRepository: IUserRepository,
    private configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async loginWithGoogleCode(code: string): Promise<Result<TokenResponse>> {
    this.logger.log({ code }, 'loginWithGoogleCode called');

    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      'postmessage',
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const { data } = await oauth2.userinfo.get();

    const tokenResponse = await this.loginWithGoogle({
      email: data.email,
      name: data.name,
      picture: data.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    });

    return Result.ok(tokenResponse);
  }

  async loginWithGoogle(googleUser: GoogleUserDto) {
    this.logger.log({ email: googleUser.email }, 'loginWithGoogle called');

    let user = await this.userRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await this.userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        accessToken: googleUser.accessToken,
        refreshToken: googleUser.refreshToken,
        isTwoFactorEnabled: true,
      });
    } else {
      await this.userRepository.update(user.id, {
        accessToken: googleUser.accessToken,
        refreshToken: googleUser.refreshToken,
        isTwoFactorEnabled: true,
      });
    }

    return this.getTokens(user.id, user.email, true);
  }

  async register(
    registerDto: RegisterDto,
  ): Promise<Result<RegisterResponseDto>> {
    this.logger.log({ email: registerDto.email }, 'register called');

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

    const tokens = await this.getTokens(user.id, user.email, false);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return Result.ok({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  }

  async login(loginDto: LoginDto): Promise<Result<LoginResponse>> {
    this.logger.log({ email: loginDto.email }, 'login called');

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

    const tokens = await this.getTokens(user.id, user.email, true);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return Result.ok({
      ...tokens,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
  }

  async enableTwoFactor(
    userId: string,
    email: string,
  ): Promise<Result<TwoFactorGenerateResponseDto>> {
    const user = await this.userRepository.findByEmail(email);

    if (user && user.isTwoFactorEnabled) {
      return Result.ok({
        qrCodeUrl: '',
      });
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(email, 'Gmail Listener', secret);
    const qrCodeUrl = await toDataURL(otpauthUrl);

    await this.userRepository.update(userId, {
      twoFactorSecret: secret,
    });

    return Result.ok({
      qrCodeUrl,
    });
  }

  async verifyTwoFactor(
    email: string,
    twoFactorCode: string,
  ): Promise<Result<TokenResponse>> {
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.twoFactorSecret) {
      return Result.fail(new ForbiddenException('2FA secret not generated'));
    }

    const isValid = authenticator.verify({
      token: twoFactorCode,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      return Result.fail(new ForbiddenException('Invalid 2FA code'));
    }

    await this.userRepository.update(user.id, {
      isTwoFactorEnabled: true,
    });

    const tokens = await this.getTokens(user.id, user.email, true);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return Result.ok(tokens);
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<Result<TokenResponse>> {
    this.logger.log({ userId }, 'refreshTokens called');

    const user = await this.userRepository.findOne(userId);

    if (!user || !user.hashedRefreshToken) {
      return Result.fail(new ForbiddenException('Access Denied'));
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      return Result.fail(new ForbiddenException('Access Denied'));
    }

    const tokens = await this.getTokens(user.id, user.email, true);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

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
    isTwoFactorAuthenticated: boolean,
  ): Promise<TokenResponse> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          email,
          isTwoFactorAuthenticated,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '15m',
        },
      ),
      this.jwt.signAsync(
        {
          sub: userId,
          email,
          isTwoFactorAuthenticated,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
