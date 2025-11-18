import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentService {
    constructor(private readonly config: ConfigService) { }

    get dbEncryptionKey(): string {
        return this.config.get<string>('DB_ENCRYPTION_KEY')!;
    }

    get port(): number {
        return this.config.get<number>('PORT', 3000);
    }
}
