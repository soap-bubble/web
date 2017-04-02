import mongoose from 'mongoose';
import config from 'config';
import install from './install';
import * as morpheus_v1 from '../models/morpheus_v1';
import Promise from 'bluebird';

mongoose.Promise = Promise;

export default function (cb) {
  const db = mongoose.connect(config.mongodb.uri, {server:{auto_reconnect:true}});
  install(db,  morpheus_v1);
  mongoose.connection.once('open', cb);
  return db;
}

export update from './update';
export prime from './prime';
export { get as getModel } from './install';
