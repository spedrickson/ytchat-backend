import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { Permission } from './api-key.decorator';
import { KeyGuard } from './api-key.guard';
import { ModCommentDto } from './comment.dto';
import { ModCommentService } from '../modcomment/modcomment.service';
import * as util from 'util';

@UseGuards(KeyGuard)
@Controller('api')
export class MessageController {
  private readonly logger = new Logger(MessageController.name);

  constructor(
    private messageService: MessageService,
    private modcommentService: ModCommentService,
  ) {
    util.inspect.defaultOptions.depth = null;
  }

  @Permission('view')
  @Get('auth/view')
  getViewPermission(@Res() res) {
    return res.status(HttpStatus.OK).json('ok');
  }

  @Permission('view')
  @Post('messages')
  async getFilteredMessages(@Res() res, @Body() body) {
    // this.logger.log(body);
    const messages = await this.messageService.getFilteredMessages(
      body['filters'],
      body['sort'],
    );
    return res.status(HttpStatus.OK).json(messages);
  }

  @Permission('view')
  @Post('randommessage')
  async getRandomMessage(@Res() res, @Body() body) {
    // this.logger.log(body);
    this.logger.log(new Date().getTime() - body['timestamp']);
    const messages = await this.messageService.getRandomMessage(
      body['filter'],
      body['timestamp'],
    );
    return res.status(HttpStatus.OK).json(messages);
  }

  @Permission('view')
  @Get('channel/:channelID')
  async getAuthorInfo(@Res() res, @Param('channelID') channelID) {
    let [info, modcommentCount] = await Promise.all([
      this.messageService.getAuthor(channelID),
      this.modcommentService.getModCommentCount(channelID),
    ]);
    if (!info) throw new NotFoundException('author has never spoken in chat');
    // this.logger.log(info)
    info['modcommentCount'] = modcommentCount ?? 0;
    // this.logger.log(info)
    return res.status(HttpStatus.OK).json(info);
  }

  @Permission('view')
  @Get('/search/channels/:searchTerm')
  async getAuthorBySearch(
    @Res() res,
    @Param('searchTerm') searchTerm,
    @Query('limit') limit?: number,
    @Query('caseSensitive') caseSensitive?: boolean,
  ) {
    // this.logger.log(searchTerm);
    const authors = await this.messageService.getAuthorsByRegex(
      searchTerm,
      limit ? limit : 25,
      caseSensitive ? caseSensitive : false,
      false,
    );
    return res.status(HttpStatus.OK).json(authors);
  }

  @Permission('view')
  @Get('messages/newer')
  async getNewerMessages(
    @Res() res,
    @Query('messageID') messageID?: string,
    @Query('from') from?: string,
    @Query('channelID') channelID?: string,
    @Query('user') user?: string,
    @Query('limit') limit?: number,
  ) {
    // this.logger.log(`getting messages newer than: ${messageID}`);
    const messages = await this.messageService.getNewerMessages(
      messageID ?? from,
      channelID ?? user,
      limit ? limit : 100,
    );
    if (!messages) throw new NotFoundException('no messages newer than id');
    return res.status(HttpStatus.OK).json(messages);
  }

  @Permission('view')
  @Get('messages/older')
  async getOlderMessages(
    @Res() res,
    @Query('messageID') messageID?: string,
    @Query('from') from?: string,
    @Query('channelID') channelID?: string,
    @Query('user') user?: string,
    @Query('limit') limit?: number,
  ) {
    // this.logger.log(`getting messages older than: ${messageID}`);
    const messages = await this.messageService.getOlderMessages(
      messageID ?? from,
      channelID ?? user,
      limit ? limit : 100,
    );
    if (!messages) throw new NotFoundException('no messages newer than id');
    return res.status(HttpStatus.OK).json(messages);
  }

  @Permission('comment')
  @Post('channel/:channelID/comments')
  async addModComment(
    @Res() res,
    @Req() req,
    @Body() comment: ModCommentDto,
    @Param('channelID') channelID,
  ) {
    const mod = req.authenticatedUser;
    await this.modcommentService.insertModComment(
      channelID,
      mod.channelId,
      comment.text,
      mod.name,
    );
    return res.status(HttpStatus.OK).json('success');
  }

  /**
   * Gets mod comments for the specified channel ID
   * @param res
   * @param channelID
   * @returns ModCommentSchema
   */
  @Permission('view')
  @Get('channel/:channelID/comments')
  async getModComments(@Res() res, @Param('channelID') channelID) {
    const comments = await this.modcommentService.getModComments(channelID);
    if (!comments) throw new NotFoundException('no mod comments for user');
    return res.status(HttpStatus.OK).json(comments);
  }

  /**
   * Counts multiple messages in given time period
   * @param res
   * @param messages a list of messages that will be counted for given time period
   * @param start ms timestamp to count messages after
   * @param end ms timestamp to count messages before
   * @returns list of counts for each provided message in the given time period
   */
  @Permission('view')
  @Get('messagecount')
  async getMessageCount(
    @Res() res,
    @Query('m') messages: [],
    @Query('start') start: number,
    @Query('end') end: number,
  ) {
    if (!Array.isArray(messages)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json("must specify at least 2 message strings ('&m=')");
    }
    const results = await this.messageService.getMessageInstanceCount(
      messages,
      start,
      end,
    );
    if (!results) throw new NotFoundException('no data found for query');
    let counts = results[0];
    if (!counts) {
      counts = {};
    }
    messages.forEach((m) => {
      if (!counts.hasOwnProperty(m)) {
        counts[m] = 0;
      }
    });
    return res.status(HttpStatus.OK).json(counts);
  }

  @Permission('view')
  @Post('comments')
  /**
   * Endpoint for getting comments with arbitrary filters and sorting
   * @param res
   * @param payload Body with any of the following fields:
   *   * filters - MongoDB query object to match comments
   *   * sort - MongoDB sort object to order comments
   *   * skip - integer above zero, number of comments to skip after filtering and sorting
   *   * limit - integer above zero, number of comments to return (max 1000)
   *   * publishedAfter - number representing the JS Date after which comments should be published (added to filters)
   *   * publishedBefore - number representing the JS Date before which comments should be published (added to filters)
   *   * fields - string-array of fields names the endpoint should return (parent and parentId is always returned if `includeParent` is set)
   *   * includeParent - if a parentId is set, will attempt to include parent comment as field `parent`
   * @returns array of comments matching filters/sorts/limits/etc.
   */
  async getComments(@Res() res, @Body() payload: object) {
    this.logger.debug('filter', payload);
    const filters = payload['filters'] ?? {};
    const sort = payload['sort'] ?? {};
    const skip = payload['skip'];
    const limit = payload['limit'];
    const publishedAfter = payload['publishedAfter'];
    const publishedBefore = payload['publishedBefore'];

    if (publishedAfter || publishedBefore) filters.publishedAt = {};
    if (publishedAfter) filters.publishedAt.$gte = new Date(publishedAfter);
    if (publishedBefore) filters.publishedAt.$lte = new Date(publishedBefore);
    const fields = payload['fields'] ?? [];
    const includeParent = payload['includeParent'] ?? false;
    if (skip < 0) {
      throw new BadRequestException(
        "'skip' param must be greater than 0 or omitted",
      );
    }
    if (limit < 1 || limit > 1000) {
      throw new BadRequestException(
        "'limit' param must be between 1 and 1000 (inclusive)",
      );
    }

    const projection = fields.reduce((k, v) => ({ ...k, [v]: 1 }), {});
    if (includeParent) {
      projection.parentId = 1;
    }
    const results = await this.messageService.getComments(
      filters,
      sort,
      skip,
      limit,
      projection,
      includeParent,
    );
    return res.status(HttpStatus.OK).json(results);
  }

  // potential unban interfaces:
  //
  // @Permission('comment')
  // @Post('bannedusers/upload')
  // async setBannedUsers(@Res() res, @Req() req, @Body() body) {
  //   this.logger.log(Object.keys(body));
  //   return res.status(HttpStatus.OK).json('success');
  // }

  // @Permission('view')
  // @Get('sponsors/byhour')
  // async getSponsorsByHour(@Res() res) {
  //   const result = await this.messageService.getSponsorsByHour();
  //   this.logger.log(result);
  //   return res.status(HttpStatus.OK).json(result);
  // }

  // @Permission('comment')
  // @Post('bannedusers/comment/:channelID')
  // async addUnbanRequest(
  //   @Res() res,
  //   @Req() req,
  //   @Body() body,
  //   @Param('channelID') channelID,
  // ) {
  //   this.logger.log('adding unban request');
  //   this.logger.log(body);
  //   const timestamp = body.timestamp ?? Date.now();
  //   if (!body.message)
  //     return res
  //       .status(HttpStatus.BAD_REQUEST)
  //       .json("request must specify 'message' param");
  //   const result = this.bannedUserService.addUnbanRequest(
  //     channelID,
  //     body.message,
  //     timestamp,
  //   );
  //   this.logger.log(result);
  //   return res.status(HttpStatus.OK).json('unban comment added');
  // }
}
