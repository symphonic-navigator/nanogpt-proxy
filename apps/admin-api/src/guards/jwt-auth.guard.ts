import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../security/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];

    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = auth.slice('Bearer '.length).trim();
    const payload = await this.tokenService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const revoked = await this.tokenService.isBlacklisted(payload.jti);
    if (revoked) {
      throw new UnauthorizedException('Token revoked');
    }

    (req as any).user = {
      sub: payload.sub,
      r: [payload.r],
    };

    return true;
  }
}
