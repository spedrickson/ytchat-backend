import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop()
  apikey: string;
  @Prop()
  channelId: string;
  @Prop()
  name: string;
  @Prop()
  canView: boolean;
  @Prop()
  canBan: boolean;
  @Prop()
  canSubmit: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
