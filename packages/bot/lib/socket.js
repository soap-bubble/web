import socketio from 'socket.io';
import config from 'config';
import { Server } from 'http';
import bunyan from 'bunyan';
import uuid from 'uuid';

import testClientFactory from './testClient';
import actions from './actions';

const logger = bunyan.createLogger({ name: 'soapbubble-bot-socket' });



export default async function (app, morpheus, profileProvider, twitchChat, provideTwitchUserToken) {
  let client = morpheus;
  let testClient;
  let gameSocket;
  const server = Server(app);
  const io = socketio(server);
  const { letsPlayChannel } = await profileProvider();

  logger.info('Socket server starting');
  // io.set('origins', config.origins);
  io.origins((origin, callback) => {
    if (origin !== config.origins && origin !== '*') {
      return callback('origin not allowed', false);
    }
    callback(null, true);
  });
  io.on('error', err => logger.error(err));
  const uChannel = uuid();
  io.on('connection', (socket) => {
    logger.info('connection');
    // socket.on('test', (token, channel, cb) => {
    //   const messageHandler = actions({
    //     emit(...args) {
    //       if (gameSocket) {
    //         logger.info('Sending test response to game');
    //         gameSocket.emit(uChannel, ...args);
    //       } else {
    //         logger.warn('No game socket detected');
    //       }
    //     },
    //   });
    //   logger.info('Test client open at', channel);
    //   if (token === data.token) {
    //     logger.info('Test token matches');
    //     if (testClient) {
    //       testClient.removeAllListeners('message');
    //     }
    //     testClient = testClientFactory(socket, channel);
    //     testClient.on('message', messageHandler);
    //     cb();
    //   }
    // });

    socket.on('reset', () => {
      provideTwitchUserToken.reset();
      twitchChat.connect();
    });

    socket.on('letsplay', (channel) => {
      if (letsPlayChannel === channel) {
        gameSocket = socket;
        const messageHandler = actions({
          emit(...args) {
            socket.emit(uChannel, ...args);
          },
        });
        socket.emit('CREATE_CHANNEL', uChannel)
        logger.info(`Creating letsplay channel ${uChannel}`);
        client.on('message', messageHandler);
        socket.on('disconnect', function disconnectHandler(reason) {
          logger.info('disconnect', { reason });
          client.off('message', messageHandler);
          gameSocket = null;
        });
        return socket.on(uChannel, data => {
          if (data.type === 'SCENE_DO_ENTER') {
            // client.letsPlay(`Entering scene ${data.payload}`);
          }
        });
      }
      return logger.warn('Do not recognize channel', {
        expected: data.letsPlayChannel,
        actual: channel,
      });
    });
  });

  return {
    server,
    io,
    setClient(_client) {
      client = _client;
    },
  };
}
