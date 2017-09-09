import { Schema } from 'mongoose';

const user = new Schema({
  id: String,
  meta: Schema.Types.Mixed,
});

user.methods.byId = function userById(id) {
  return this.model('User').find({ id });
};

export default user;
