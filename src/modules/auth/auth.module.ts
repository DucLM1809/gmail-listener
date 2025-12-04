import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { AuthController } from './controllers/auth.controller';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { AuthService } from './services/auth.service';
import { GoogleStrategy } from './strategies/google-oauth.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { UserRepository } from 'src/infrastructure/repositories/user.repository';
import { EmailModule } from '../email/email.module';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    GoogleStrategy,
    JwtStrategy,
    RefreshTokenStrategy,
    GoogleOAuthGuard,
    { provide: 'IUserRepository', useClass: UserRepository },
  ],
})
export class AuthModule {}
