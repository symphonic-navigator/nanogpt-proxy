import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
  constructor(private readonly config: ConfigService) {}

  private getRequired<T = string>(key: string): T {
    const value = this.config.get<T>(key);
    if (value === undefined || value === null) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  private getOrDefault<T>(key: string, defaultValue: T): T {
    const value = this.config.get<T>(key);
    return value === undefined || value === null ? defaultValue : value;
  }

  get adminEmail(): string {
    return this.getRequired<string>('ADMIN_EMAIL');
  }

  get adminPassword(): string {
    return this.getRequired<string>('ADMIN_PASSWORD');
  }

  get dbEncryptionKey(): string {
    return this.getRequired<string>('DB_ENCRYPTION_KEY');
  }

  get proxyPort(): number {
    return this.getOrDefault<number>('PROXY_PORT', 3000);
  }
}
