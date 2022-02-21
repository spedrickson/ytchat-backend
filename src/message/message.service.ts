import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './interfaces/message.interface';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
  ) {}

  async getNewerMessages(
    messageId: string,
    channelId: string,
    limit: number,
  ): Promise<Message[]> {
    const filters = {
      _id: { $gt: messageId },
    };
    if (channelId) filters['author.channelId'] = channelId;
    return await this.messageModel.find(filters).limit(limit).exec();
  }

  async getMessageCount(channelId: string) {
    return await this.messageModel
      .countDocuments({ 'author.channelId': channelId })
      .exec();
  }

  async getOlderMessages(
    messageId: string,
    channelId: string,
    limit: number,
  ): Promise<Message[]> {
    const filters = {};
    if (messageId) filters['_id'] = { $lt: messageId };
    if (channelId) filters['author.channelId'] = channelId;
    // console.log(filters);
    return await this.messageModel
      .find(filters)
      .limit(limit)
      .sort({ _id: -1 })
      .exec();
  }

  async getAuthor(channelId: string): Promise<Message[]> {
    return await this.messageModel
      .find({ 'author.channelId': channelId })
      .limit(1)
      .sort({ _id: -1 })
      .exec();
  }

  // takes a while
  async getAllAuthors() {
    return await this.messageModel
      .aggregate([
        {
          $group: {
            _id: '$author.channelId',
            doc: {
              $first: '$$ROOT.author',
            },
          },
        },
        {
          $replaceRoot: { newRoot: '$doc' },
        },
      ])
      .exec();
  }
}
