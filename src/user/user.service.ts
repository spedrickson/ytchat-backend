import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User } from './schemas/user.schema';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserService {
  public cachedUsers;
  public cachedKeys = new Set();

  constructor(@InjectModel('User') private readonly userModel: Model<User>) {
    this.updateUserCache().then();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateUserCache() {
    try {
      this.cachedUsers = await this.getAllUsers();
      this.cachedKeys.clear();
      this.cachedUsers.forEach((item) => this.cachedKeys.add(item.apikey));
    } catch (e) {
      console.log(`error while updating user cache: ${e.message}`);
    }
  }
}
