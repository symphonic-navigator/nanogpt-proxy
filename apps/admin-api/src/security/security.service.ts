import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { EnvironmentService } from '@nanogpt-monorepo/core';
import { UserEntity } from '@nanogpt-monorepo/core/dist/entities/user-entity';
import { JwtPayload } from '@nanogpt-monorepo/core/dist/types/jwt-payload';

@Injectable()
export class SecurityService {
  constructor(private readonly env: EnvironmentService) {}

  private readonly rounds = 12;

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  createToken(user: Pick<UserEntity, 'email' | 'role'>): string {
    const payload: JwtPayload = {
      sub: user.email,
      r: [user.role],
    };

    return jwt.sign(payload, this.env.jwtSecret, {
      expiresIn: this.env.jwtExpiresIn,
    });
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.env.jwtSecret) as JwtPayload;
    } catch {
      return null;
    }
  }
}
