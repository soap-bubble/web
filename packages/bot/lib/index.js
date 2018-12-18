import config from 'config';
import bunyan from 'bunyan';

import factory, { init, define } from './factory';

import clientFactory from './client';
import appFactory from './app';
import socketFactory from './socket';
import { fetchBotProfile, saveBotProflie } from './profile';
import twitchApiFactory from './twitchApi';
import twitchChatFactory from './twitchChat';

const app = appFactory();

define({
  app: appFactory,
  socket: socketFactory,
  morpheus: clientFactory,
  config: () => config,
  logger: () => bunyan.createLogger({ name: 'morpheus-bot' }),
  profile: fetchBotProfile,
  saveProfile: saveBotProflie,
  twitchApi: twitchApiFactory,
  twitchChat: twitchChatFactory,
});

init();

factory(function init(socket, logger, twitchChat) {
  socket.server.listen(config.port, () => {
    logger.info(`App listening on port ${config.port}`);
  });
})
