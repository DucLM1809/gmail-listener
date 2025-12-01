import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { AuthService } from '../services/auth.service';

import {
  UserAlreadyExistsException,
  InvalidCredentialsException,
} from '../exceptions/auth.exceptions';

import { BaseController } from 'src/core/base.controller';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';

@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.handleResult(await this.authService.register(registerDto));
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.handleResult(await this.authService.login(loginDto));
  }

  @Post('google')
  async googleLogin(@Body('code') code: string) {
    return this.handleResult(await this.authService.loginWithGoogleCode(code));
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
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
