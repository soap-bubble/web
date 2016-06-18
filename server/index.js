import express from 'express';
import bunyan from 'bunyan';

const logger = bunyan.createLogger({name: 'webgl-pano-server'});
const app = express();

app.use(express.static('public'));

app.listen(8050, () => {
  logger.info('up and running');
});