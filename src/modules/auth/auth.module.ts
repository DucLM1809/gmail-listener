import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AuthController } from './controllers/auth.controller';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { AuthService } from './services/auth.service';
import { GoogleStrategy } from './strategies/google-oauth.strategy';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: 'your_jwt_secret',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, GoogleOAuthGuard],
})
export class AuthModule {}
