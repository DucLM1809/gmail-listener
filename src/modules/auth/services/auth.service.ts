import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async loginWithGoogle(googleUser: any) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
        },
      });
    } else {
      await this.prisma.user.update({
        where: { email: googleUser.email },
        data: {
          accessToken: googleUser.accessToken,
          refreshToken: googleUser.refreshToken,
        },
      });
    }

    return this.jwt.sign({
      email: user.email,
      sub: user.id,
    });
  }
}
