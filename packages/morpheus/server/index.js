import path from 'path';
import express from 'express';
import bunyan from 'bunyan';
import config from 'config';
import routes from './routes';
import socket from './socket';

import { get as getModel } from './db/install';
import db, { prime, update } from './db';

const logger = bunyan.createLogger({ name: 'webgl-pano-server' });
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '../client/html'));

const server = socket(app);

const indexHtml = (function () {
  if (process.env.NODE_ENV === 'production' && process.env.MORPHEUS_ENVIRONMENT === 'staging') {
    return 'index-staging.html';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'index-production.html';
  }
  return 'index.html';
})();

const gameDbPath = path.resolve(config.gameDbPath);
logger.info('static game dir', { gameDbPath });
const rootPath = config.rootPath ? config.rootPath : '';
app.use(`${rootPath}/GameDB`, express.static(gameDbPath));
app.get(`${rootPath}/index.html`, (req, res) => {
  res.sendFile(path.join(__dirname, `../public/${indexHtml}`));
});
app.use(rootPath, express.static('public'));
app.use(`${rootPath}/api`, routes);


app.db = db()
  .then(() => {
    getModel('Scene').find().exec().then((scenes) => {
      let p = Promise.resolve();
      if (scenes.length === 0 && process.env.MORPHEUS_PRIME_DB) {
        logger.info('Attempting to prime DB');
        p = p.then(() => prime())
          .then(() => logger.info('db primed'))
          .catch(err => logger.error('Failed to prime db', err));
      }
      if (process.env.MORPHEUS_UPDATE_DB) {
        logger.info('Attempting to update DB');
        p = p.then(() => update())
        .then(() => logger.info('db updated'))
        .catch(err => logger.error('Failed to update db', err));
      }
      return p;
    });
  });

server.listen(config.port, () => {
  logger.info('server up and running on 8050');
});
