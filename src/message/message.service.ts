import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import * as util from 'util';
// import * as mongoose from 'mongoose';
import { Model, PipelineStage } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorSearch, Message } from './interfaces/message.interface';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MessageService implements OnModuleInit {
  private lastCacheUpdate: number = null;
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>,
    @InjectModel('AuthorSearch')
    private readonly authorSearchModel: Model<AuthorSearch>,
  ) {}

  async getFilteredMessages(userFilters, sort): Promise<Message[]> {
    // mongoose.set('debug', true);
    return await this.messageModel
      .find(userFilters)
      .limit(100)
      .sort(sort)
      .exec();
  }

  async getAuthorsBySearch(
    filter: string,
    limit: number,
    caseSensitive: boolean,
  ): Promise<Author[]> {
    return await this.authorSearchModel
      .find(
        { $text: { $search: filter, $caseSensitive: caseSensitive } },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' }, lastTimestamp: -1 })
      .limit(limit)
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
  @Cron(CronExpression.EVERY_MINUTE)
  async refreshAuthorCache() {
    if (this.lastCacheUpdate === null) {
      return;
    }
    const startTime = performance.now();
    const startTimestamp = Date.now() - 10000;
    const aggregation: Array<PipelineStage> = [
      {
        $match: {
          timestamp: { $gt: this.lastCacheUpdate },
        },
      },
      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $group: {
          _id: '$author.channelId',
          author: {
            $first: '$author',
          },
          timestamp: {
            $first: '$timestamp',
          },
        },
      },
      {
        $addFields: {
          'author.lastTimestamp': '$timestamp',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              {
                _id: '$author.channelId',
              },
              '$author',
            ],
          },
        },
      },
      {
        $merge: {
          into: 'authors',
          on: '_id',
          whenMatched: 'replace',
          whenNotMatched: 'insert',
        },
      },
    ];
    this.authorSearchModel
      .aggregate(aggregation, { allowDiskUse: true })
      .exec();
    this.logger.log(
      `refreshing author cache took ${Math.round(performance.now() - startTime)}ms (>${this.lastCacheUpdate})`,
    );
    this.lastCacheUpdate = startTimestamp;
  }

  async setLastCacheUpdate() {
    const startTime = performance.now();
    const result = await this.authorSearchModel
      .findOne()
      .sort({ lastTimestamp: -1 })
      .limit(1)
      .select('lastTimestamp')
      .exec();
    if (result !== null) {
      this.lastCacheUpdate = result['lastTimestamp'];
    } else {
      this.lastCacheUpdate = 0;
    }
    const endTime = performance.now();
    this.logger.log(
      `fetching last cache timestamp took ${Math.round(endTime - startTime)}ms`,
    );
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
    await this.setLastCacheUpdate();
    this.refreshAuthorCache();
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
            record: { $last: '$message' },
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
