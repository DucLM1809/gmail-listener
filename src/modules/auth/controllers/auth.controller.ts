import { Controller, Get, Request, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
