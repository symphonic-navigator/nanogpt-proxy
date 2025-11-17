import { Module } from '@nestjs/common';
import { ForwarderController } from './forwarder.controller';
import { ForwarderService } from './forwarder.service';

import { EnvironmentModule } from '../../../../packages/core/src/environment/environment.module';
import { CryptoModule } from '../../../../packages/core/src/crypto/crypto.module';
import { RedisModule } from '../../../../packages/core/src/redis/redis.module';
import { UserRepository } from '../../../../packages/core/src/user/user.repository';

@Module({
    imports: [EnvironmentModule, CryptoModule, RedisModule],
    controllers: [ForwarderController],
    providers: [ForwarderService, UserRepository],
})
export class ForwarderModule { }
