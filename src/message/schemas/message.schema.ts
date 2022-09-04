import * as mongoose from 'mongoose';

export const AuthorSchema = new mongoose.Schema({
  isVerified: Boolean,
  isChatOwner: Boolean,
  isChatSponsor: Boolean,
  isChatModerator: Boolean,
  isBanned: Boolean,
  channelId: String,
  name: String,
  badgeUrl: String,
  messageCount: Number,
  modcommentCount: Number,
});

export const MessageSchema = new mongoose.Schema(
  {
    timestamp: Number,
    type: String,
    datetime: String,
    message: String,
    messageEx: Array,
    author: AuthorSchema,
    amountValue: Number,
    amountString: String,
  },
  { collection: 'messages' },
);

MessageSchema.index({ timestamp: 1 });
MessageSchema.index({ 'author.channelId': 1 });
