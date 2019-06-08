import config from 'config';
import bunyan from 'bunyan';

import factory, { init, define } from './factory';

import clientFactory from './client';
import appFactory from './app';
import socketFactory from './socket';
import { fetchBotProfileProvider, saveBotProflie } from './profile';
import twitchApiFactory from './twitchApi';
import twitchChatFactory from './twitchChat';

define({
  app: appFactory,
  socket: socketFactory,
  morpheus: clientFactory,
  config: () => config,
  logger: () => bunyan.createLogger({ name: 'morpheus-bot' }),
  profileProvider: fetchBotProfileProvider,
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
