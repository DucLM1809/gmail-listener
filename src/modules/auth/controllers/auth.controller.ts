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

  @Get()
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const token = await this.authService.loginWithGoogle(req);

    res.redirect(`${process.env.CLIENT_REDIRECT_URI}?token=${token}`);
  }
}
