import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserService {
  public cachedUsers = {};

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {
    this.updateUserCache().then();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateUserCache() {
    try {
      const users = await this.getAllUsers();
      for (const member in this.cachedUsers) delete this.cachedUsers[member];
      users.forEach((item) => {
        this.cachedUsers[item.apikey] = item;
      });
    } catch (e) {
      console.log(`error while updating user cache: ${e.message}`);
    }
  }
}
