import { Schema } from 'mongoose';

const user = new Schema({
  emails: [{
    value: String,
    emailType: String,
  }],
  displayName: String,
  profiles: [{ providerType: String, id: String }],
});

user.methods.getId = function getUserId() {
  // eslint-disable-next-line no-underscore-dangle
  return this._id;
};

user.methods.byId = function userById(id) {
  return this.model('User').findOne({ _id: id });
};

export default user;
