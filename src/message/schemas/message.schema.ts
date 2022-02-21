import * as mongoose from 'mongoose';

export const AuthorSchema = new mongoose.Schema({
  isVerified: Boolean,
  isChatOwner: Boolean,
  isChatSponsor: Boolean,
  isChatModerator: Boolean,
  channelId: String,
  name: String,
  badgeUrl: String,
  messageCount: Number,
});

export const MessageSchema = new mongoose.Schema({
  type: String,
  datetime: String,
  message: String,
  messageEx: Array,
  author: AuthorSchema,
  amountValue: Number,
  amountString: String,
});
