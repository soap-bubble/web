import config from 'config';
import express from 'express';
import createLogger from './logger';
import $, { init } from './factory';
import * as models from './model';
import routes from './routes';
import { db, init as initDb, install as installDb } from './db';

const logger = createLogger('app');

init({
  app: express(),
  db,
  createLogger,
});

const { port } = config;

initDb(config)
  .then(() => installDb(models))
  .then(() => $(app => new Promise((resolve, reject) => {
    app.listen(port, (err) => {
      if (err) return reject(err);
      logger.info(`Running on port ${port}`);
      return resolve();
    });
  })))
  .then(() => $(app => routes(app)));
