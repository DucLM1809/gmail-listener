import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserSession } from '../interfaces/user-session.interface';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserSession => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
