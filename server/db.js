import mongoose from 'mongoose';
import Promise from 'bluebird';

import createLogger from './logger';

const logger = createLogger('db');

export default function dbInit(config) {
  mongoose.Promise = Promise;
  logger.info('Opening up connection to DB');
  const db = mongoose.createConnection(config.mongodb.uri, {
    useMongoClient: true,
    autoReconnect: true,
  });

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
