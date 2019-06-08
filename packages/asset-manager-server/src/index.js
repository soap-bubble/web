import express from 'express';
import multer from 'multer';
import bunyan from 'bunyan';
import config from 'config';

const logger = bunyan.createLogger({ name: 'asset-manager-server' });
const app = express();

const uploadRoute = new express.Router();
const uploadMulter = multer({ dest: config.get('uploadDest') });
uploadRoute.put('/asset', uploadMulter.single('asset'), (req, res) => {
  res.send('OK');
});

app.use(uploadRoute);
app.use('/jaz', express.static(config.get('jazArchive')));

const port = config.get('port');
app.listen(port, () => {
  logger.info(`Asset manager up on port ${port}`);
});
