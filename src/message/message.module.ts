import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from './schemas/message.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '../user/user.module';
import { ModCommentModule } from '../modcomment/modcomment.module';
import { BannedUserModule } from '../bannedUsers/banneduser.module';

// console.log('message module init');
// console.log(process.env.TEST);
const channelId = process.env.YTCHAT_CHANNELID
  ? process.env.YTCHAT_CHANNELID
  : 'UCrPseYLGpNygVi34QpGNqpA';
console.log(`launching for channelID: ${channelId}`);

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://readonly:test@127.0.0.1:27017', {
      useNewUrlParser: true,
      dbName: channelId,
    }),
    MongooseModule.forFeature([{ name: 'Message', schema: MessageSchema }]),
    ScheduleModule.forRoot(),
    UserModule,
    ModCommentModule,
    BannedUserModule,
  ],
  providers: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}
