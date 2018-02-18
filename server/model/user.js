import { Schema } from 'mongoose';

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
  roles: [{ type: String }],
  admin: Boolean,
});

export default user;
