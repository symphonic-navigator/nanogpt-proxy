import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CryptoModule, RedisModule, UserRepository } from '@nanogpt-monorepo/core';

@Module({
  imports: [CryptoModule, RedisModule],
  providers: [AuthService, UserRepository],
  controllers: [AuthController],
})
export class AuthModule {}
