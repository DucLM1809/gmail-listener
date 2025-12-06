import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { google } from 'googleapis';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';
import { Result } from 'src/core/result';
import { AppLoggerService } from 'src/core/services/app-logger.service';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { EmailService } from 'src/modules/email/email.service';
import { GoogleUserDto } from '../dto/google-user.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { RegisterDto } from '../dto/register.dto';
import { TwoFactorGenerateResponseDto } from '../dto/two-factor-generate-response.dto';
import { UserProfileDto } from '../dto/user-profile.dto';
import {
  InvalidCredentialsException,
  InvalidTokenException,
  InvalidTokenTypeException,
  PasswordReuseException,
  UserAlreadyExistsException,
} from '../exceptions/auth.exceptions';
import { LoginResponse, TokenResponse } from '../interfaces/token.response';
import { TokenService } from './token.service';
import { UserSession } from 'src/core/interfaces/user-session.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IUserRepository') private userRepository: IUserRepository,
    private configService: ConfigService,
    private readonly logger: AppLoggerService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
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

    return this.getTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      true,
    );
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

    const tokens = await this.getTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      false,
    );

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

    const tokens = await this.getTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      false,
    );

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

    const tokens = await this.getTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      true,
    );
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return Result.ok(tokens);
  }

  async getProfile(userId: string): Promise<Result<UserProfileDto>> {
    const user = await this.userRepository.findOne(userId);

    if (!user) {
      return Result.fail(new InvalidCredentialsException());
    }

    return Result.ok({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    });
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

    const tokens = await this.getTokens(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      true,
    );

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
    payload: UserSession,
    isTwoFactorAuthenticated: boolean,
  ): Promise<TokenResponse> {
    const { userId, email, role } = payload;

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateToken({
        userId,
        email,
        role,
        isTwoFactorAuthenticated,
      }),
      this.tokenService.generateToken({
        userId,
        email,
        role,
        isTwoFactorAuthenticated,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async forgotPassword(email: string): Promise<Result<boolean>> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return Result.fail(new InvalidCredentialsException());
    }

    const token = await this.tokenService.generateToken({
      userId: user.id,
      email: user.email,
      type: 'reset-password',
    });

    // Send email
    const resetLink = `${this.configService.get('CLIENT_URI')}/auth/reset-password?token=${token}`;

    await this.emailService.sendTemplateEmail(
      user.email,
      'Password Reset Request',
      'reset-password',
      { resetLink },
    );

    return Result.ok(true);
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<Result<boolean>> {
    const payload = await this.tokenService.verifyToken(token);

    if (!payload) {
      return Result.fail(new InvalidTokenException());
    }

    if (payload.type !== 'reset-password') {
      return Result.fail(new InvalidTokenTypeException());
    }

    const user = await this.userRepository.findOne(payload.sub);

    if (!user) {
      return Result.fail(new InvalidCredentialsException());
    }

    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);

      if (isSamePassword) {
        return Result.fail(new PasswordReuseException());
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
    });

    return Result.ok(true);
  }
}
