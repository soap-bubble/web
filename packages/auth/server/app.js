import config from 'config';
import express from 'express';
import morgan from 'morgan';
import createLogger from './logger';
import $, { define, init } from './factory';
import * as models from './model';
import routes from './routes';
import passport from './passport';
import middleware from './middleware';
import db, { install as installDb } from './db';
import permissions from './permissions';

const logger = createLogger('app');

define({
  db,
  permissions,
  app: () => express(),
  baseRoute(app) {
    const router = new express.Router();
    app.use(config.rootPath, router);
    router.use(morgan('combined'));
    return router;
  },
  models: () => models,
  config: () => {
    if (process.env.SOAPBUBBLE_LOCAL_SSL) {
      return {
        ...config,
        rootPath: '/auth',
      };
    }
    return config;
  },
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
