import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BannedUser, BanneduserSchema } from './schemas/banneduser.schema';
import { BannedUserService } from './banneduser.service';
import { BannedUserController } from './banneduser.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BannedUser.name, schema: BanneduserSchema },
    ]),
  ],
  exports: [BannedUserService],
  providers: [BannedUserService, JwtAuthGuard, ConfigService],
  controllers: [BannedUserController],
})
export class BannedUserModule {}
