import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModCommentSchema } from './schemas/modcomment.schema';
import { ModCommentService } from './modcomment.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ModComment', schema: ModCommentSchema },
    ]),
  ],
  exports: [ModCommentService],
  providers: [ModCommentService],
})
export class ModCommentModule {}
