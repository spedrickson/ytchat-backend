import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BannedUser } from './schemas/banneduser.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BannedUserService {
  public cachedBannedUsers = {};

  constructor(
    @InjectModel('BannedUser')
    private readonly bannedUserModel: Model<BannedUser>,
  ) {
    this.cachedBannedUsers = this.getAllBannedUsers();
  }

  // mongo query to pull all banned users
  async getAllBannedUsers(): Promise<BannedUser[]> {
    return await this.bannedUserModel
      .aggregate([
        { $project: { _id: 0, externalChannelId: 1, displayName: 1 } },
      ])
      .exec();
  }

  // currently unused
  async addUnbanRequest(
    channelId,
    message,
    timestamp = Date.now(),
  ): Promise<any> {
    return this.bannedUserModel
      .updateOne(
        { externalChannelId: channelId },
        {
          $set: {
            unbanRequestMessage: message,
            unbanApproved: false,
            unbanDenied: false,
            unbanRequestTime: timestamp,
          },
        },
      )
      .exec();
  }

  // simple boolean check if the channelId is in the list of banned users
  isUserBanned(channelId): boolean {
    const user = this.cachedBannedUsers[channelId];
    return Boolean(user && !user.unbanDenied).valueOf();
  }

  // get all details about a user's ban (currently channelId and displayName)
  getUserBanDetails(channelId) {
    return this.cachedBannedUsers[channelId];
  }

  // keep the cache of banned users updated in case more are added
  @Cron(CronExpression.EVERY_MINUTE)
  async updateBannedUserCache() {
    try {
      const users = await this.getAllBannedUsers();
      for (const member in this.cachedBannedUsers)
        delete this.cachedBannedUsers[member];
      users.forEach((item) => {
        this.cachedBannedUsers[item.externalChannelId] = item;
      });
    } catch (e) {
      console.log(`error while updating banned user cache: ${e.message}`);
    }
  }
}
