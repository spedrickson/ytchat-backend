import { Injectable, OnModuleInit } from '@nestjs/common';
// import * as util from 'util';
// import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message } from './interfaces/message.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MessageService implements OnModuleInit {
  public authorCache: Map<string, object>;
  private lastCacheUpdate;

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
  ) {
    // util.inspect.defaultOptions.depth = null;
    // mongoose.set('debug', true);
    this.authorCache = new Map();
  }

  async getFilteredMessages(userFilters, sort: object): Promise<Message[]> {
    // mongoose.set('debug', true);
    return await this.messageModel
      .find(userFilters)
      .limit(100)
      .sort(sort)
      .exec();
  }

  async getRandomMessage(filter, timestamp): Promise<Message[]> {
    // mongoose.set('debug', true);
    return await this.messageModel
      .aggregate(
        [
          {
            $match: {
              timestamp: {
                $gt: timestamp,
              },
              message: new RegExp(filter),
            },
          },
          {
            $sample: {
              size: 1,
            },
          },
        ],
        { allowDiskUse: true },
      )
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
    // mongoose.set('debug', false);
    if (channelId) filters['author.channelId'] = channelId;
    return await this.messageModel.find(filters).limit(limit).exec();
  }

  async getMessageCount(channelId: string) {
    // mongoose.set('debug', false);
    return await this.messageModel
      .countDocuments({ 'author.channelId': channelId })
      .exec();
  }

  async getOlderMessages(
    messageId: string,
    channelId: string,
    limit: number,
  ): Promise<Message[]> {
    // mongoose.set('debug', false);
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
    // mongoose.set('debug', false);
    return await this.messageModel
      .find({ 'author.channelId': channelId })
      .limit(1)
      .sort({ timestamp: -1 })
      .exec();
  }

  // Updates author cache with the latest authors
  @Cron(CronExpression.EVERY_30_SECONDS)
  async refreshAuthorCache() {
    if (this.lastCacheUpdate) {
      try {
        // mongoose.set('debug', false);
        const unixEpochMs = Date.now() - 60000; // subtract 1 minute to prevent missed authors
        const authors = await this.getRecentAuthors(this.lastCacheUpdate);
        authors.forEach((author) => {
          this.authorCache.set(author.channelId, author);
        });
        this.lastCacheUpdate = unixEpochMs;
      } catch (e) {
        console.log(`error while pulling authors: ${e.message}`);
      }
    }
  }

  // Aggregates all authors from the database, can take a while
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async fillAuthorCache() {
    console.log('performing full author pull, this may take a while...');
    try {
      const startTime = performance.now();
      // mongoose.set('debug', false);
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

  // Aggregate details of all authors after specified timestamp
  async getRecentAuthors(timestamp) {
    // mongoose.set('debug', false);
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

  async getSponsorsByHour() {
    // mongoose.set('debug', false);
    return this.messageModel
      .aggregate(
        [
          {
            $match: {
              type: 'newSponsor',
            },
          },
          {
            $project: {
              datetime: { $substr: ['$datetime', 0, 13] },
            },
          },
          {
            $group: {
              _id: '$datetime',
              count: {
                $sum: 1,
              },
            },
          },
        ],
        { allowDiskUse: true },
      )
      .exec();
  }

  // takes a while
  async getAllAuthors() {
    // mongoose.set('debug', false);
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
    this.fillAuthorCache();
  }

  async getMessageInstanceCount(messages: [], start, end) {
    if (messages.length === 0) {
      return [];
    }
    return await this.messageModel
      .aggregate([
        {
          $match: {
            timestamp: {
              $gt: parseInt(start),
              $lt: parseInt(end),
            },
            message: new RegExp(`^${messages.join('$|^')}$`, 'i'),
          },
        },
        {
          $group: {
            _id: '$author.channelId',
            record: { $first: '$message' },
          },
        },
        {
          $group: {
            _id: {
              $toLower: '$record',
            },
            count: {
              $sum: 1,
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $arrayToObject: [
                [
                  {
                    k: '$_id',
                    v: {
                      $toString: '$count',
                    },
                  },
                ],
              ],
            },
          },
        },
        {
          $group: {
            _id: 0,
            merged: {
              $push: '$$ROOT',
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: '$merged',
            },
          },
        },
      ])
      .exec();
  }
}
