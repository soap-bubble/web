import { Schema } from 'mongoose';

const user = new Schema({
  id: String,
  emails: [{
    value: String,
    emailType: String,
  }],
  displayName: String,
  profiles: [{ providerType: String, id: String }],
});

user.methods.byId = function userById(id) {
  return this.model('User').findOne({ _id: id });
};

export default user;
