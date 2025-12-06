import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UseGuards,
  Get,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppLoggerService } from 'src/core/services/app-logger.service';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { AuthService } from '../services/auth.service';

import {
  InvalidCredentialsException,
  InvalidTokenException,
  InvalidTokenTypeException,
  PasswordReuseException,
  UserAlreadyExistsException,
} from '../exceptions/auth.exceptions';

import { BaseController } from 'src/core/base.controller';
import { BaseErrorResponseDto } from 'src/core/dto/base-error-response.dto';
import { RegisterResponseDto } from '../dto/register-response.dto';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { TwoFactorGenerateResponseDto } from '../dto/two-factor-generate-response.dto';
import { TwoFactorEnableDto } from '../dto/two-factor-enable.dto';
import { TwoFactorRequiredException } from '../exceptions/auth.exceptions';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { User } from 'src/core/decorators/user.decorator';
import { UserSession } from 'src/core/interfaces/user-session.interface';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController extends BaseController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: AppLoggerService,
  ) {
    super();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or User already exists',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: BaseErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log('Register request received');
    return this.handleResult(await this.authService.register(registerDto));
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: BaseErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log('Login request received');
    return this.handleResult(await this.authService.login(loginDto));
  }

  @Post('google')
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in with Google',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: BaseErrorResponseDto,
  })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    this.logger.log('Google login request received');
    return this.handleResult(
      await this.authService.loginWithGoogleCode(googleLoginDto.code),
    );
  }

  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token successfully refreshed',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    type: BaseErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    type: BaseErrorResponseDto,
  })
  async refreshTokens(@User() user: UserSession) {
    this.logger.log('Refresh token request received');
    const userId = user.userId;
    const refreshToken = user.refreshToken;
    return this.handleResult(
      await this.authService.refreshTokens(userId, refreshToken),
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  async getProfile(@User() user: UserSession) {
    return this.handleResult(await this.authService.getProfile(user.userId));
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/enable')
  @ApiOperation({ summary: 'Enable 2FA (Generate Secret)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '2FA secret generated successfully',
    type: TwoFactorGenerateResponseDto,
  })
  async enableTwoFactor(@User() user: UserSession) {
    const userId = user.userId;
    const email = user.email;
    return this.handleResult(
      await this.authService.enableTwoFactor(userId, email),
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA Code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA verified and enabled successfully',
    type: TokenResponseDto,
  })
  async verifyTwoFactor(
    @User() user: UserSession,
    @Body() twoFactorEnableDto: TwoFactorEnableDto,
  ) {
    const email = user.email;

    return this.handleResult(
      await this.authService.verifyTwoFactor(
        email,
        twoFactorEnableDto.twoFactorCode,
      ),
    );
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset token generated',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.handleResult(
      await this.authService.forgotPassword(forgotPasswordDto.email),
    );
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully reset',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.handleResult(
      await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      ),
    );
  }

  protected resolveError(error: any): HttpException {
    this.logger.error(error, 'Error resolving request');
    if (error instanceof UserAlreadyExistsException) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    if (error instanceof InvalidCredentialsException) {
      return new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }

    if (error instanceof TwoFactorRequiredException) {
      return new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
          error: 'TwoFactorRequired',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (error instanceof InvalidTokenException) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    if (error instanceof InvalidTokenTypeException) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    if (error instanceof PasswordReuseException) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return super.resolveError(error);
  }
}
