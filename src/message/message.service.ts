import { Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './interfaces/message.interface';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
  ) {}

  async getChannelMessages(
    channelId: string,
    from: string,
    limit: number,
  ): Promise<Message[]> {
    if (from) {
      return this.getOlderMessages(from, channelId, limit);
    }

    // console.log(`getting messagses for: ${channelId}`);
    const filters = { 'author.channelId': channelId };
    console.log(filters);
    return await this.messageModel
      .find({ 'author.channelId': channelId })
      .sort({ _id: -1 })
      .limit(limit)
      .exec();
  }

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

  async getOlderMessages(
    messageId: string,
    channelId: string,
    limit: number,
  ): Promise<Message[]> {
    const filters = {
      _id: { $lt: messageId },
    };
    if (channelId) filters['author.channelId'] = channelId;
    return await this.messageModel
      .find(filters)
      .limit(limit)
      .sort({ _id: -1 })
      .exec();
  }
}
