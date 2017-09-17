import { Schema } from 'mongoose';

const client = new Schema({
  id: String,
  secret: String,
});

export default client;
