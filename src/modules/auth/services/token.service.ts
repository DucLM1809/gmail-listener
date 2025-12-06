import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserSession } from 'src/core/interfaces/user-session.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  async generateToken(payload: UserSession) {
    return await this.jwt.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  async verifyToken(token: string) {
    return await this.jwt.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });
  }
}
