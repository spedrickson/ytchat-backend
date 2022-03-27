import * as mongoose from 'mongoose';

export const ModCommentSchema = new mongoose.Schema(
  {
    text: String,
    modChannelId: String,
    userChannelId: String,
    modName: String,
  },
  { collection: 'modcomments', versionKey: false },
);
