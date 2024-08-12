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
    lastMessageTimestamp: Number,
    firstMessageTimestamp: Number,
    lastCommentTimestamp: Date,
    firstCommentTimestamp: Date,
  },
  { collection: 'authors' },
);
AuthorSearchSchema.index({ name: 'text' });
AuthorSearchSchema.index(
  { name: 1 },
  { collation: { locale: 'en', strength: 1 } },
);
AuthorSearchSchema.index({ lastMessageTimestamp: -1 });
AuthorSearchSchema.index({ lastCommentTimestamp: -1 });

export const CommentSchema = new mongoose.Schema({
  channelId: String,
  videoId: String,
  kind: String,
  etag: String,
  id: String,
  textDisplay: String,
  textOriginal: String,
  authorDisplayName: String,
  authorProfileImageUrl: String,
  authorChannelUrl: String,
  authorChannelId: String,
  canRate: Boolean,
  viewerRating: String,
  likeCount: Number,
  publishedAt: Date,
  updatedAt: Date,
  canReply: Boolean,
  totalReplyCount: Number,
  isPublic: Boolean,
  parentId: String,
  parent: Array,
},{ collection: 'comments' },)

CommentSchema.index({ authorChannelId: -1})
CommentSchema.index({ parentId: -1})
CommentSchema.index({ publishedAt: 1 })
