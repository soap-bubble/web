
import { Schema } from 'mongoose';

const bot = new Schema({
  token: String,
  letsPlayEnabled: Boolean,
  letsPlayChannel: String,
  letsPlayUserId: String,
});

export default bot;
