import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'generated/prisma/browser';
import { IUserRepository } from 'src/domain/repositories/user.repository.interface';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    @Inject('IUserRepository') private userRepository: IUserRepository,
  ) {}

  async loginWithGoogle(googleUser: any) {
    let user = await this.userRepository.findByEmail(googleUser.email);

    if (!user) {
      user = await this.userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        accessToken: googleUser.accessToken,
        refreshToken: googleUser.refreshToken,
      });
    } else {
      await this.userRepository.update(user.id, {
        accessToken: googleUser.accessToken,
        refreshToken: googleUser.refreshToken,
      });
    }

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    return this.jwt.sign({
      email: user.email,
      sub: user.id,
    });
  }
}
