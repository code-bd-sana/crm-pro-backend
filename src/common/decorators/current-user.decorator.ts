import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../modules/users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | User[keyof User] | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User | undefined;
    return data ? user?.[data] : user;
  },
);
