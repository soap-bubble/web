import mongoose from 'mongoose';
import Promise from 'bluebird';

import createLogger from './logger';

const logger = createLogger('db');

export default function dbInit(config) {
  mongoose.Promise = Promise;
  logger.info('Opening up connection to DB');
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
  const db = mongoose.connect(uri, connectOptions);

  db.on('open', () => {
    logger.info('Opening up connection to DB -- complete');
  });
  return db;
}

export function install(db, models) {
  logger.info('Installing models to DB');
  Object.keys(models).forEach((model) => {
    const schema = models[model];
    db.model(model, schema);
  });
  logger.info('Installing models to DB -- complete');
}
