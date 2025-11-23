import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const RefreshToken = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  const token = req.headers['x-refresh-token'];

  if (!token || typeof token !== 'string') {
    throw new UnauthorizedException('Missing refresh token');
  }

  return token;
});
