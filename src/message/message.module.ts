import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from './schemas/message.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { ModCommentModule } from '../modcomment/modcomment.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://readonly:test@127.0.0.1:27017', {
      useNewUrlParser: true,
      dbName: 'UCrPseYLGpNygVi34QpGNqpA',
    }),
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    UserModule,
    ModCommentModule,
  ],
  providers: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
