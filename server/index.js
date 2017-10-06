import path from 'path';
import express from 'express';
import bunyan from 'bunyan';
import config from 'config';
import routes from './routes';
import { get as getModel } from './db/install';
import db, { prime } from './db';

const logger = bunyan.createLogger({ name: 'webgl-pano-server' });
const app = express();

if (app.get('env') !== 'production') {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  const browserSync = require('browser-sync');
  const bs = browserSync({ logSnippet: false, ui: { port: 8051 } });
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  app.use(require('connect-browser-sync')(bs));
}

const gameDbPath = path.resolve(config.gameDbPath);
logger.info('static game dir', { gameDbPath });
app.use('/GameDB', express.static(gameDbPath));
app.use(express.static('public'));
app.use('/api', routes);

app.db = db()
  .then(() => {
    getModel('Scene').find().exec().then((scenes) => {
      if (scenes.length === 0 && process.env.MORPHEUS_PRIME_DB) {
        logger.info('Attempting to prime DB');
        prime()
          .then(() => logger.info('db primed'))
          .catch(err => logger.error('Failed to prime db', err));
      }
    });
  });

app.listen(8050, () => {
  logger.info('server up and running on 8050');
});
