import config from 'config';
import express from 'express';
import createLogger from './logger';
import $, { define, init } from './factory';
import * as models from './model';
import routes from './routes';
import passport from './passport';
import middleware from './middleware';
import db, { install as installDb } from './db';
import permissions from './permissions';

const logger = createLogger('app');

function app(config) {
  const router = new express.Router();
  const app = express();
  app.use(config.get('rootPath'), router);
  return router;
}

define({
  db,
  permissions,
  app,
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
  .then(() => $(passport))
  .then(() => $(middleware))
  .then(() => $(routes));
