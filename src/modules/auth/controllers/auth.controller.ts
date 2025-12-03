import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AppLoggerService } from 'src/core/services/app-logger.service';
import { GoogleLoginDto } from '../dto/auth/google-login.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { RegisterDto } from '../dto/auth/register.dto';
import { TokenResponseDto } from '../dto/auth/token-response.dto';
import { AuthService } from '../services/auth.service';

import {
  InvalidCredentialsException,
  UserAlreadyExistsException,
} from '../exceptions/auth.exceptions';

import { BaseController } from 'src/core/base.controller';
import { BaseErrorResponseDto } from 'src/core/dto/base-error-response.dto';
import { RegisterResponseDto } from '../dto/auth/register-response.dto';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { TwoFactorGenerateResponseDto } from '../dto/auth/two-factor-generate-response.dto';
import { TwoFactorEnableDto } from '../dto/auth/two-factor-enable.dto';
import { TwoFactorRequiredException } from '../exceptions/auth.exceptions';

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
  async refreshTokens(@Request() req) {
    this.logger.log('Refresh token request received');
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.handleResult(
      await this.authService.refreshTokens(userId, refreshToken),
    );
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
  async enableTwoFactor(@Request() req) {
    const userId = req.user['userId'];
    const email = req.user['email'];
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
    @Request() req,
    @Body() twoFactorEnableDto: TwoFactorEnableDto,
  ) {
    const email = req.user['email'];

    return this.handleResult(
      await this.authService.verifyTwoFactor(
        email,
        twoFactorEnableDto.twoFactorCode,
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
    return super.resolveError(error);
  }
}
