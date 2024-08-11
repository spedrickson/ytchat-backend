import { Document } from 'mongoose';

export interface Author extends Document {
  readonly isVerified: boolean;
  readonly isChatOwner: boolean;
  readonly isChatSponsor: boolean;
  readonly isChatModerator: boolean;
  readonly channelId: string;
  readonly name: string;
  readonly badgeUrl: string;
}

export interface Message extends Document {
  readonly type: string;
  readonly datetime: string;
  readonly message: string;
  readonly messageEx: Array<any>;
  readonly author: Author;
  readonly amountValue: number;
  readonly amountString: string;
}

export interface User extends Document {
  readonly apikey: string;
  readonly channelId: string;
  readonly name: string;
  readonly canView: boolean;
  readonly canBan: boolean;
  readonly canSubmit: boolean;
}

export interface AuthorSearch extends Document {
  readonly badgeUrl: string;
  readonly type: string;
  readonly isVerified: boolean;
  readonly isChatOwner: boolean;
  readonly isChatSponsor: boolean;
  readonly isChatModerator: boolean;
  readonly channelId: string;
  readonly channelUrl: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly lastTimestamp: number;
  readonly messageCount: number;
}

export interface Comment extends Document {
  readonly channelId: string;
  readonly videoId: string;
  readonly kind: string;
  readonly etag: string;
  readonly id: string;
  readonly textDisplay: string;
  readonly textOriginal: string;
  readonly authorDisplayName: string;
  readonly authorProfileImageUrl: string;
  readonly authorChannelUrl: string;
  readonly authorChannelId: string;
  readonly canRate: boolean;
  readonly viewerRating: string;
  readonly likeCount: number;
  readonly publishedAt: Date;
  readonly updatedAt: Date;
  readonly canReply: boolean;
  readonly totalReplyCount: number;
  readonly isPublic: boolean;
  readonly parentId: string;
}