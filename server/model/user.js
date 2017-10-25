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
});

export default user;
