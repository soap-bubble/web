import { Schema } from 'mongoose';

const user = new Schema({
  id: String,
  emails: [{
    value: String,
    emailType: String,
  }],
  displayName: String,
  profiles: [{ providerType: String, id: String }],
  settings: Schema.Types.Mixed,
});

export default user;
