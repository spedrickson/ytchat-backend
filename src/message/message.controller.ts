import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { MessageService } from './message.service';
import fuzzysort = require('fuzzysort');
import { Cron, CronExpression } from '@nestjs/schedule';

@Controller('api')
export class MessageController {
  private cachedAuthors;
  constructor(private messageService: MessageService) {}

  @Get('channel/:channelID')
  async getAuthorInfo(@Res() res, @Param('channelID') channelID) {
    // const info = await this.messageService.getAuthor(channelID);

    const [info, count] = await Promise.all([
      this.messageService.getAuthor(channelID),
      this.messageService.getMessageCount(channelID),
    ]);
    const result = info[0].author;
    result['messageCount'] = count;
    if (!info) throw new NotFoundException('author has never spoken in chat');
    return res.status(HttpStatus.OK).json(result);
  }

  // keep the author cache fresh
  @Cron(CronExpression.EVERY_MINUTE)
  async updateAuthorCache() {
    console.log('updating author cache');
    this.cachedAuthors = await this.messageService.getAllAuthors();
  }

  @Get('/search/channels/:searchTerm')
  async getAuthorBySearch(@Res() res, @Param('searchTerm') searchTerm) {
    if (!this.cachedAuthors) await this.updateAuthorCache();
    const results = fuzzysort.go(searchTerm, this.cachedAuthors, {
      key: 'name',
      limit: 30,
      allowTypo: false,
      threshold: -3000,
    });

    return res.status(HttpStatus.OK).json(results);
    // return res.status(HttpStatus.OK).json(this.cachedAuthors[0]);
  }

  @Get('channels')
  async getAllAuthors(@Res() res) {
    const users = await this.messageService.getAllAuthors();
    if (!users) throw new NotFoundException('no users match search term');
    return res.status(HttpStatus.OK).json(users);
  }

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
}
