import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CryptorService, EnvironmentService, UserRepository } from '@nanogpt-monorepo/core';
import { AdminLoginDto } from '../dtos/admin-dto';
import { AdminUser } from '@nanogpt-monorepo/core/dist/models/admin-user';
import { SecurityService } from '../security/security.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly security: SecurityService,
    private readonly env: EnvironmentService,
  ) {}

  private async ensureBootstrapAdmin(): Promise<void> {
    const email = this.env.adminEmail;
    const password = this.env.adminPassword;

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL / ADMIN_PASSWORD non configurés – aucun admin bootstrap ne sera créé.',
      );
      return;
    }

    const existing = (await this.users.getUser(email)) as AdminUser | null;
    if (existing && existing.role === 'ADMIN') {
      return;
    }

    const passwordHash = this.security.hashPassword(password);

    await this.users.createAdmin?.({
      email,
      passwordHash,
      role: 'ADMIN',
    } as AdminUser);

    this.logger.log(`Admin bootstrap créé pour ${email}`);
  }

  async login(dto: AdminLoginDto) {
    await this.ensureBootstrapAdmin();

    const user = (await this.users.getUser(dto.email)) as AdminUser | null;

    if (!user || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await this.security.verifyPassword(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      email: user.email,
      role: user.role,
    };
  }
}
