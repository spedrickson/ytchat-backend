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
MessageSchema.index({ id: 1 }, { unique: true });

// different than message author schema, extra fields related to searching
export const AuthorSearchSchema = new mongoose.Schema(
  {
    _id: String,
    badgeUrl: String,
    type: String,
    isVerified: Boolean,
    isChatOwner: Boolean,
    isChatSponsor: Boolean,
    isChatModerator: Boolean,
    channelId: String,
    channelUrl: String,
    name: String,
    imageUrl: String,
    lastTimestamp: Number,
  },
  { collection: 'authors' },
);

AuthorSearchSchema.index({ name: 'text' });
AuthorSearchSchema.index(
  { name: 1 },
  { collation: { locale: 'en', strength: 1 } },
);
AuthorSearchSchema.index({ lastTimestamp: -1 });
