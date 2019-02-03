import express from 'express';
import bunyan from 'bunyan';
import path from 'path';

const logger = bunyan.createLogger({ name: 'core' });
const app = express();

if (app.get('env') !== 'production') {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  const browserSync = require('browser-sync');
  const bs = browserSync({ logSnippet: false, ui: { port: 8051 } });
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  app.use(require('connect-browser-sync')(bs));
}

app.use(express.static('public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(8060, () => {
  logger.info('server up and running on 8050');
});
