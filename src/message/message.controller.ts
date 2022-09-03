import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import fuzzysort = require('fuzzysort');
import { Permission } from './api-key.decorator';
import { KeyGuard } from './api-key.guard';
import { ModCommentDto } from './comment.dto';
import { ModCommentService } from '../modcomment/modcomment.service';
import { BannedUserService } from '../bannedUsers/banneduser.service';
import * as util from 'util';

@UseGuards(KeyGuard)
@Controller('api')
export class MessageController {
  private static FUZZY_OPTIONS = {
    key: 'name',
    limit: 200,
    allowTypo: false,
    threshold: -500,
  };

  constructor(
    private messageService: MessageService,
    private modcommentService: ModCommentService,
    private bannedUserService: BannedUserService,
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
    // console.log(body);
    // console.log(body);
    const messages = await this.messageService.getFilteredMessages(
      body['filters'],
      body['sort'],
    );
    return res.status(HttpStatus.OK).json(messages);
  }

  @Permission('view')
  @Get('channel/:channelID')
  async getAuthorInfo(@Res() res, @Param('channelID') channelID) {
    const [info, messageCount, modcommentCount] = await Promise.all([
      this.messageService.getAuthor(channelID),
      this.messageService.getMessageCount(channelID),
      this.modcommentService.getModCommentCount(channelID),
    ]);
    if (!info) throw new NotFoundException('author has never spoken in chat');
    const result = info[0]?.author;
    if (!result) throw new NotFoundException('author has never spoken in chat');
    result['messageCount'] = messageCount ?? 0;
    result['modcommentCount'] = modcommentCount ?? 0;
    result['isBanned'] = this.bannedUserService.isUserBanned(channelID);
    if (result['isBanned'])
      result['banDetails'] =
        this.bannedUserService.getUserBanDetails(channelID);
    return res.status(HttpStatus.OK).json(result);
  }

  @Permission('view')
  @Get('/search/channels/:searchTerm')
  async getAuthorBySearch(@Res() res, @Param('searchTerm') searchTerm) {
    // if (!this.cachedAuthors) await this.updateAuthorCache();
    const results = fuzzysort.go(
      searchTerm,
      Array.from(this.messageService.authorCache.values()),
      MessageController.FUZZY_OPTIONS,
    );

    return res.status(HttpStatus.OK).json(results);
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
    // console.log(`getting messages newer than: ${messageID}`);
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
    // console.log(`getting messages older than: ${messageID}`);
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

  // potential unban interfaces:
  //
  // @Permission('comment')
  // @Post('bannedusers/upload')
  // async setBannedUsers(@Res() res, @Req() req, @Body() body) {
  //   console.log(Object.keys(body));
  //   return res.status(HttpStatus.OK).json('success');
  // }

  // @Permission('view')
  // @Get('sponsors/byhour')
  // async getSponsorsByHour(@Res() res) {
  //   const result = await this.messageService.getSponsorsByHour();
  //   console.log(result);
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
  //   console.log('adding unban request');
  //   console.log(body);
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
  //   console.log(result);
  //   return res.status(HttpStatus.OK).json('unban comment added');
  // }
}
