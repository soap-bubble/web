import { Schema } from 'mongoose';

const group = new Schema({
  id: String,
  name: String,
  entitlements: [{
    name: String,
  }],
  users: [{
    id: String,
  }],
});

export default group;
