import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export const RefreshToken = createParamDecorator((data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();

  const headerValue: string | string[] | undefined = req.headers['x-refresh-token'];

  if (!headerValue) {
    throw new UnauthorizedException('Missing refresh token');
  }

  if (Array.isArray(headerValue)) {
    const first = headerValue.find(Boolean);
    if (!first) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return first;
  }

  // Ici, c’est forcément un string
  return headerValue;
});
