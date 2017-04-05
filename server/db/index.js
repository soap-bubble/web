import mongoose from 'mongoose';
import config from 'config';
import Promise from 'bluebird';

import * as morpheusV1 from '../models/morpheus_v1';
import install from './install';

mongoose.Promise = Promise;

export { default as update } from './update';
export { default as prime } from './prime';
export { get as getModel } from './install';

export default function () {
  return mongoose.connect(config.mongodb.uri, {
    server: {
      auto_reconnect: true,
    },
  })
    .then(() => install(mongoose, morpheusV1))
    .then(() => mongoose);
}
