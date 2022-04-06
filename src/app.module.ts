import { Module } from '@nestjs/common';
import { MessageModule } from './message/message.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [MessageModule, ConfigModule.forRoot()],
})
export class AppModule {}
