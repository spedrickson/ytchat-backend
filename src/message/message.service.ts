import { Injectable, OnModuleInit } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './interfaces/message.interface';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as util from 'util';
import * as mongoose from 'mongoose';

@Injectable()
export class MessageService implements OnModuleInit {
  public authorCache: Map<string, object>;
  private lastCacheUpdate;

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
  ) {
    util.inspect.defaultOptions.depth = null;
    mongoose.set('debug', true);
    this.authorCache = new Map();
  }

  async getFilteredMessages(userFilters, sort: object): Promise<Message[]> {
    // console.log(userFilters);
    mongoose.set('debug', true);
    const results = await this.messageModel
      .find(userFilters)
      .limit(100)
      .sort(sort)
      .exec();
    console.log(results.length);
    return results;
  }

  async getNewerMessages(
    messageId: string,
    channelId: string,
    limit: number,
  ): Promise<Message[]> {
    const filters = {
      _id: { $gt: messageId },
    };
    mongoose.set('debug', false);
    if (channelId) filters['author.channelId'] = channelId;
    return await this.messageModel.find(filters).limit(limit).exec();
  }

  async getMessageCount(channelId: string) {
    mongoose.set('debug', false);
    return await this.messageModel
      .countDocuments({ 'author.channelId': channelId })
      .exec();
  }

  async getOlderMessages(
    messageId: string,
    channelId: string,
    limit: number,
  ): Promise<Message[]> {
    mongoose.set('debug', false);
    const filters = {};
    if (messageId) filters['_id'] = { $lt: messageId };
    if (channelId) filters['author.channelId'] = channelId;
    return await this.messageModel
      .find(filters)
      .limit(limit)
      .sort({ timestamp: -1 })
      .exec();
  }

  async getAuthor(channelId: string): Promise<Message[]> {
    mongoose.set('debug', false);
    return await this.messageModel
      .find({ 'author.channelId': channelId })
      .limit(1)
      .sort({ timestamp: -1 })
      .exec();
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async refreshAuthorCache() {
    if (this.lastCacheUpdate) {
      try {
        // const startTime = performance.now();
        mongoose.set('debug', false);
        // const oldSize = this.authorCache.size;
        const unixEpochMs = Date.now() - 60000; // subtract 1 minute to prevent missed authors
        const authors = await this.getRecentAuthors(this.lastCacheUpdate);
        authors.forEach((author) => {
          this.authorCache.set(author.channelId, author);
        });
        this.lastCacheUpdate = unixEpochMs;
        // const endTime = performance.now();
        // console.log(
        //   `refreshing author cache (since ${
        //     this.lastCacheUpdate
        //   }) took ${Math.round(endTime - startTime)}ms, size: ${
        //     this.authorCache.size
        //   }, got: ${authors.length}, new: ${this.authorCache.size - oldSize}`,
        // );
      } catch (e) {
        console.log(`error while pulling authors: ${e.message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async fillAuthorCache() {
    console.log('performing full author pull, this may take a while...');
    try {
      const startTime = performance.now();
      mongoose.set('debug', false);
      const unixEpochMs = Date.now() - 60000;
      const authors = await this.getAllAuthors();
      authors.forEach((author) => {
        this.authorCache.set(author.channelId, author);
      });
      this.lastCacheUpdate = unixEpochMs;
      const endTime = performance.now();
      console.log(
        `filling author cache took ${Math.round(
          endTime - startTime,
        )}ms, size: ${this.authorCache.size}`,
      );
    } catch (e) {
      console.log(`error while pulling authors: ${e.message}`);
    }
  }

  async getRecentAuthors(timestamp) {
    mongoose.set('debug', false);
    return await this.messageModel
      .aggregate(
        [
          { $match: { timestamp: { $gte: timestamp } } },
          { $sort: { timestamp: -1 } },
          {
            $group: {
              _id: '$author.channelId',
              author: {
                $first: '$$ROOT.author',
              },
              timestamp: { $first: '$$ROOT.timestamp' },
            },
          },
          {
            $addFields: {
              'author.lastTimestamp': '$timestamp',
            },
          },
          {
            $replaceRoot: { newRoot: '$author' },
          },
        ],
        { allowDiskUse: true },
      )
      .exec();
  }

  // takes a while
  async getAllAuthors() {
    mongoose.set('debug', false);
    return await this.messageModel
      .aggregate(
        [
          { $sort: { timestamp: -1 } },
          {
            $group: {
              _id: '$author.channelId',
              author: {
                $first: '$$ROOT.author',
              },
              timestamp: { $first: '$$ROOT.timestamp' },
            },
          },
          {
            $addFields: {
              'author.lastTimestamp': '$timestamp',
            },
          },
          {
            $replaceRoot: { newRoot: '$author' },
          },
        ],
        { allowDiskUse: true },
      )
      .exec();
  }

  async onModuleInit(): Promise<void> {
    new Promise(this.fillAuthorCache);
  }
}
