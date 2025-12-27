
import { Schema } from 'mongoose';

const bot = new Schema({
  token: String,
  letsPlayEnabled: Boolean,
  letsPlayChannel: String,
  letsPlayUserId: String,
  twitchTokenAccess: String,
  twitchTokenRefresh: String,
  twitchTokenExpiresIn: Number,
  twitchBotName: String,
});

export default bot;
