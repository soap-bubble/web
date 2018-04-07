import config from 'config';
import bunyan from 'bunyan';

import clientFactory from './client';
import appFactory from './app';
import socketFactory from './socket';

const logger = bunyan.createLogger({ name: 'soapbubble-bot' });
const app = appFactory();
const socket = socketFactory(app);
socket.setClient(clientFactory(config.discord));


socket.server.listen(config.port, () => {
  logger.info(`App listening on port ${config.port}`);
});
