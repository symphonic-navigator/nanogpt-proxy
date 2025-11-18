import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ForwarderModule } from './forwarder/forwarder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ForwarderModule,
  ],
})
export class AppModule {}
