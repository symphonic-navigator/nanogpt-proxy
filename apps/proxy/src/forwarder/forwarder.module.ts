import { Module } from '@nestjs/common';
import { ForwarderController } from './forwarder.controller';
import { ForwarderService } from './forwarder.service';
import {
  CryptoModule,
  EnvironmentModule,
  RedisModule,
  UserRepository,
} from '@nanogpt-monorepo/core';

@Module({
  imports: [EnvironmentModule, CryptoModule, RedisModule],
  controllers: [ForwarderController],
  providers: [ForwarderService, UserRepository],
})
export class ForwarderModule {}
