import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageSchema } from './schemas/message.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '../user/user.module';
import { ModCommentModule } from '../modcomment/modcomment.module';
import { BannedUserModule } from '../bannedUsers/banneduser.module';

const channelId = process.env.YTCHAT_CHANNELID
  ? process.env.YTCHAT_CHANNELID
  : 'UCrPseYLGpNygVi34QpGNqpA';
console.log(`launching for channelID: ${channelId}`);

const mongodb_string = process.env.YTCHAT_BACKEND_MONGOSTRING
  ? process.env.YTCHAT_BACKEND_MONGOSTRING
  : 'mongodb://user:password@127.0.0.1:27017';

@Module({
  imports: [
    MongooseModule.forRoot(mongodb_string, {
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
