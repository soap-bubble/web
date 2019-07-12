import mongoose from 'mongoose';
import config from 'config';
import Promise from 'bluebird';

import * as morpheus from '../models/morpheus';
import install from './install';

mongoose.Promise = Promise;

export { default as update } from './update';
export { default as prime } from './prime';
export { get as getModel } from './install';

export default function () {
  let uri = config.mongodb.uri;
  const connectOptions = {
    useMongoClient: true,
    autoReconnect: true,
  };
  if (config.mongodb.username && config.mongodb.password) {
    const url = new URL(uri);
    url.username = config.mongodb.username;
    url.password = config.mongodb.password;
    uri = url.href;
  }
  return mongoose.connect(uri, connectOptions)
    .then(() => install(mongoose, morpheus))
    .then(() => mongoose);
}
