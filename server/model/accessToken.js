import { Schema } from 'mongoose';
import client from './client';
import user from './user';

const accessToken = new Schema({
  client,
  user,
  token: { type: String, minLength: 12 },
});

export default accessToken;
