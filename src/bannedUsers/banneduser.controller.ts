import {
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/test')
export class BannedUserController {
  @UseGuards(JwtAuthGuard)
  @Get('test')
  getViewPermission(@Res() res) {
    return res.status(HttpStatus.OK).json('ok');
  }

  @Post('test')
  receiveAuth(@Res() res, @Req() req) {
    console.log(req);
    return res.status(HttpStatus.OK).json('ok');
  }
}
