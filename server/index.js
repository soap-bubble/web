import path from 'path';
import express from 'express';
import bunyan from 'bunyan';
import config from 'config';
import mongoose from 'mongoose';
import routes from './routes';
import morpheus from './models/morpheus';

mongoose.Promise = Promise;
const logger = bunyan.createLogger({name: 'webgl-pano-server'});
const app = express();

if (app.get('env') !== 'production') {
  var browserSync = require('browser-sync');
  var bs = browserSync({ logSnippet: false });
  app.use(require('connect-browser-sync')(bs));
}

const gameDbPath = path.resolve(config.gameDbPath);
logger.info('static game dir', { gameDbPath });
app.use('/GameDB', express.static(gameDbPath));
app.use(express.static('public'));
app.use('/api', routes);

app.db = mongoose.connect(config.mongodb.uri, {server:{auto_reconnect:true}});
morpheus.install(app.db);

app.listen(8050, () => {
  logger.info('server up and running on 8050');
});
