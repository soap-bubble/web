import { Schema } from 'mongoose';
import Role from './role';

const group = new Schema({
  name: String,
  roles: [Role],
});

export default group;
