import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../dto/auth/register.dto';
import { LoginDto } from '../dto/auth/login.dto';
import { GoogleLoginDto } from '../dto/auth/google-login.dto';
import { TokenResponseDto } from '../dto/auth/token-response.dto';
import { AuthService } from '../services/auth.service';

import {
  UserAlreadyExistsException,
  InvalidCredentialsException,
} from '../exceptions/auth.exceptions';

import { BaseController } from 'src/core/base.controller';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
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
  })
  async login(@Body() loginDto: LoginDto) {
    return this.handleResult(await this.authService.login(loginDto));
  }

  @Post('google')
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in with Google',
    type: TokenResponseDto,
  })
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.handleResult(
      await this.authService.loginWithGoogleCode(googleLoginDto.code),
    );
  }

  @UseGuards(RefreshTokenGuard)
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
  })
  async refreshTokens(@Request() req) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    return this.handleResult(
      await this.authService.refreshTokens(userId, refreshToken),
    );
  }

  protected resolveError(error: any): HttpException {
    if (error instanceof UserAlreadyExistsException) {
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    if (error instanceof InvalidCredentialsException) {
      return new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
    return super.resolveError(error);
  }
}
