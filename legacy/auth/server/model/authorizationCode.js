import { Schema } from 'mongoose';
import client from './client';
import user from './user';

const authorizationCode = new Schema({
  client,
  user,
  code: { type: String, minLength: 12 },
});

export default authorizationCode;
