import { Schema } from 'mongoose';

const role = new Schema({
  id: String,
  displayName: String,
  key: String,
  permissions: [{ type: String }],
});

export default role;
