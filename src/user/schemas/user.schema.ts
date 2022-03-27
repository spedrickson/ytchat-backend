import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class Permissions {
  @Prop()
  view: boolean;

  @Prop()
  comment: boolean;

  @Prop()
  ban: boolean;

  @Prop()
  unban: boolean;
}

@Schema({ collection: 'users' })
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
  @Prop()
  isAdmin: boolean;
  @Prop()
  perms: Permissions;
}

export const UserSchema = SchemaFactory.createForClass(User);
