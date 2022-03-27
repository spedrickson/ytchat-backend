import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModComment } from './interfaces/modcomment.interface';

@Injectable()
export class ModCommentService {
  constructor(
    @InjectModel('ModComment')
    private readonly modcommentModel: Model<ModComment>,
  ) {}

  async insertModComment(
    userChannelID: string,
    modChannelID: string,
    text: string,
    modName: string,
  ) {
    return this.modcommentModel.create({
      text: text,
      modChannelId: modChannelID,
      modName: modName,
      userChannelId: userChannelID,
    });
  }

  async getModComments(channelID: string) {
    return this.modcommentModel.find({
      userChannelId: channelID,
    });
  }

  async getModCommentCount(channelID: string) {
    return this.modcommentModel
      .countDocuments({ userChannelId: channelID })
      .exec();
  }
}
