import { Document } from 'mongoose';

export interface ModComment extends Document {
  readonly text: string;
  readonly modChannelId: string;
  readonly userChannelId: string;
  readonly modName: string;
}
