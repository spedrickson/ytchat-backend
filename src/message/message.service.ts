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

  async onModuleInit(): Promise<void> {
    this.refreshAuthorCache();
  }

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
  // uses the last author timestamp to only scan recent messages
  @Cron(CronExpression.EVERY_30_SECONDS)
  async refreshAuthorCache() {
    this.lastCacheUpdate = await this.getLastAuthorTimestamp();
    const startTime = performance.now();
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
    this.messageModel.aggregate(aggregation, { allowDiskUse: true }).exec();
    this.logger.debug(
      `[${Math.round(performance.now() - startTime)}ms] refreshed author db > ${this.lastCacheUpdate}`,
    );
  }
  // finds the last message timestamp
  async getLastMessageTimestamp() {
    const startTime = performance.now();
    const result = await this.messageModel
      .findOne()
      .sort({ timestamp: -1 })
      .limit(1)
      .select('timestamp')
      .exec();
    this.logger.debug(
      `[${Math.round(performance.now() - startTime)}ms] fetched last message timestamp: ${result['timestamp']}`,
    );
    if (result !== null) {
      return result['timestamp'];
    } else {
      return 0;
    }
  }

  // finds the last author timestamp, to ensure cache refreshes always pull the right data
  async getLastAuthorTimestamp() {
    const startTime = performance.now();
    const result = await this.authorSearchModel
      .findOne()
      .sort({ lastTimestamp: -1 })
      .limit(1)
      .select('lastTimestamp')
      .exec();
    this.logger.debug(
      `[${Math.round(performance.now() - startTime)}ms] fetched last author timestamp: ${result['lastTimestamp']}`,
    );
    if (result !== null) {
      return result['lastTimestamp'];
    } else {
      return 0;
    }
  }

  // creates a partial+unique index for timestamps >= the latest message
  // the messageID index is only used to prevent duplicate messages,
  // so we only need to track IDs of new messages
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async trimMessageIdIndex() {
    const lastTimestamp = await this.getLastMessageTimestamp();
    let start = performance.now();
    this.logger.warn('starting trim');
    await this.messageModel.collection
      .dropIndex('id_1')
      .catch(() => this.logger.warn('was missing id_1 index'));
    this.logger.log(
      `[${performance.now() - start}ms] dropped index, starting re-index...`,
    );
    start = performance.now();
    const result = await this.messageModel.collection.createIndex(
      { id: 1 },
      {
        unique: true,
        partialFilterExpression: {
          timestamp: {
            $gte: lastTimestamp,
          },
        },
      },
    );
    this.logger.warn(
      `[${performance.now() - start}ms] finished trim: ${result}`,
    );
  }

  // Aggregate details of all authors after specified timestamp
  async getRecentAuthors(timestamp: number) {
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

  // completely refills the author collection from the message db
  // only necessary if you think the author cache is corrupted in some way
  // very slow, as it iterates every message in the db
  async resetAuthorCache() {
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
