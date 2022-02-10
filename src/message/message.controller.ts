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

@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get('channel/:channelID')
  async getChannelMessages(
    @Res() res,
    @Param('channelID') channelID,
    @Query('from') from?: string,
    @Query('limit') limit?: number,
  ) {
    const messages = await this.messageService.getChannelMessages(
      channelID,
      from ? from : null,
      limit ? limit : 100,
    );
    if (!messages) throw new NotFoundException('no messages from user');
    return res.status(HttpStatus.OK).json(messages);
  }

  @Get('newer/:messageID')
  async getNewerMessages(
    @Res() res,
    @Param('messageID') messageID,
    @Query('channelID') channelID?: string,
    @Query('limit') limit?: number,
  ) {
    console.log(`getting messages newer than: ${messageID}`);
    const messages = await this.messageService.getNewerMessages(
      messageID,
      channelID,
      limit ? limit : 100,
    );
    if (!messages) throw new NotFoundException('no messages newer than id');
    return res.status(HttpStatus.OK).json(messages);
  }

  @Get('older/:messageID')
  async getOlderMessages(
    @Res() res,
    @Param('messageID') messageID,
    @Query('channelID') channelID?: string,
    @Query('limit') limit?: number,
  ) {
    console.log(`getting messages older than: ${messageID}`);
    const messages = await this.messageService.getOlderMessages(
      messageID,
      channelID,
      limit ? limit : 100,
    );
    if (!messages) throw new NotFoundException('no messages newer than id');
    return res.status(HttpStatus.OK).json(messages);
  }
}
