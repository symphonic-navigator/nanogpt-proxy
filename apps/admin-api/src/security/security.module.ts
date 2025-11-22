import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { EnvironmentModule } from '@nanogpt-monorepo/core';

@Module({
  imports: [EnvironmentModule],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
