import { Schema } from 'mongoose';
import Role from './role';

const user = new Schema({
  id: String,
  emails: [{
    value: String,
    emailType: String,
  }],
  displayName: String,
  profiles: [{ providerType: String, id: String }],
  settings: {
    saves: [{ type: Schema.Types.Mixed }],
  },
  roles: [String],
  admin: Boolean,
});

export default user;
