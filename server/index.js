import path from 'path';
import express from 'express';

const app = express();

if (app.get('env') !== 'production') {
  var browserSync = require('browser-sync');
  var bs = browserSync({ logSnippet: false });
  app.use(require('connect-browser-sync')(bs));
}

app.use(express.static('public'));

app.listen(8060, () => {
  console.log('server up and running on 8060');
});
