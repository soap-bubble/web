import express from 'express';
import bunyan from 'bunyan';
import path from 'path';
import config from 'config';

const { port, name } = config;

const logger = bunyan.createLogger({ name });
const app = express();


app.use(express.static('public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  logger.info(`server up and running on ${port}`);
});
