import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BannedUserDocument = BannedUser & Document;

@Schema({ collection: 'banned_users' })
export class BannedUser {
  @Prop()
  externalChannelId: string;
  @Prop()
  displayName: string;
}

export const BanneduserSchema = SchemaFactory.createForClass(BannedUser);
