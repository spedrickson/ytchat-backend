import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BannedUser } from './schemas/banneduser.schema';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as mongoose from 'mongoose';

@Injectable()
export class BannedUserService {
  public cachedBannedUsers = {};

  constructor(
    @InjectModel('BannedUser')
    private readonly bannedUserModel: Model<BannedUser>,
  ) {
    this.cachedBannedUsers = this.getAllBannedUsers();
  }

  async getAllBannedUsers(): Promise<BannedUser[]> {
    mongoose.set('debug', false);
    return await this.bannedUserModel
      .aggregate([
        { $project: { _id: 0, externalChannelId: 1, displayName: 1 } },
      ])
      .exec();
  }

  isUserBanned(channelId): boolean {
    return this.cachedBannedUsers.hasOwnProperty(channelId);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async updateBannedUserCache() {
    try {
      // const startTime = performance.now();
      const users = await this.getAllBannedUsers();
      for (const member in this.cachedBannedUsers)
        delete this.cachedBannedUsers[member];
      users.forEach((item) => {
        this.cachedBannedUsers[item.externalChannelId] = item;
      });
      // const endTime = performance.now();
      // console.log(
      //   `filling banned user cache took ${Math.round(
      //     endTime - startTime,
      //   )}ms, size: ${Object.keys(this.cachedBannedUsers).length}`,
      // );
    } catch (e) {
      console.log(`error while updating banned user cache: ${e.message}`);
    }
  }

  // async updateUserCache() {
  //   try {
  //     const users = await this.getAllUsers();
  //     for (const member in this.cachedUsers) delete this.cachedUsers[member];
  //     users.forEach((item) => {
  //       this.cachedUsers[item.apikey] = item;
  //     });
  //   } catch (e) {
  //     console.log(`error while updating user cache: ${e.message}`);
  //   }
  // }
}
