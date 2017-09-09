import config from 'config';
import express from 'express';
import createLogger from './logger';
import $, { define, init } from './factory';
import * as models from './model';
import routes from './routes';
import middleware from './middleware';
import db, { install as installDb } from './db';

const logger = createLogger('app');

define({
  db,
  app: () => express(),
  models: () => models,
  config: () => config,
  createLogger: () => createLogger,
});
init();

const { port } = config;

function createAppListener(app) {
  logger.info(`Starting app on port ${port}`);
  return new Promise((resolve, reject) => {
    app.listen(port, (err) => {
      if (err) return reject(err);
      logger.info(`Starting app on port ${port} -- complete`);
      return resolve();
    });
  });
}

Promise.resolve()
  .then(() => $(installDb))
  .then(() => $(createAppListener))
  .then(() => $(middleware))
  .then(() => $(routes));
