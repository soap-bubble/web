import mongoose from 'mongoose';
import Promise from 'bluebird';

import createLogger from './logger';

const logger = createLogger('db');
export function db() { return mongoose; }

export function init(config) {
  mongoose.Promise = Promise;
  logger.info('Opening up connection to DB');
  return mongoose.connect(config.mongodb.uri, {
    useMongoClient: true,
    autoReconnect: true,
  })
    .then(() => logger.info('DB connection open'));
}

export function install(models) {
  logger.info('Installing models to DB');
  Object.keys(models).forEach((model) => {
    const schema = models[model];
    mongoose.model(model, schema);
  });
  logger.info('Models installed');
}
