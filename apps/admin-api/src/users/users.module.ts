import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CryptoModule,
  EnvironmentModule,
  EnvironmentService,
  RedisModule,
  RedisService,
  UserRepository,
} from '@nanogpt-monorepo/core';
import { UsersController } from './users.controller';
import { SecurityService } from '../security/security.service';
import { SecurityModule } from '../security/security.module';
import { AuthService } from '../auth/auth.service';

@Module({
  imports: [EnvironmentModule, CryptoModule, RedisModule, SecurityModule],
  providers: [UsersService, UserRepository],
  controllers: [UsersController],
})
export class UsersModule {}
