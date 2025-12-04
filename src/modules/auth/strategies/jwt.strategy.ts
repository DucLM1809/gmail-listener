import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';
import { UserSession } from 'src/core/interfaces/user-session.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject('IUserRepository') private userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(
    payload: any,
  ): Promise<Pick<UserSession, 'userId' | 'email' | 'role'>> {
    const user = await this.userRepository.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.isTwoFactorEnabled) {
      if (!payload.isTwoFactorAuthenticated) {
        throw new UnauthorizedException('Two-factor authentication required');
      }
    }

    return { userId: payload.sub, email: payload.email, role: user.role };
  }
}
