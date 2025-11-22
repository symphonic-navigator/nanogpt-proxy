import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SecurityService } from './security.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly security: SecurityService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = auth.slice('Bearer '.length).trim();
    const payload = this.security.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    (req as any).user = {
      sub: payload.sub,
      r: [payload.r],
    };

    return true;
  }
}
