import socketio from 'socket.io';
import config from 'config';
import { Server } from 'http';
import axios from 'axios';
import bunyan from 'bunyan';
import uuid from 'uuid';

import testClientFactory from './testClient';
import actions from './actions';

const logger = bunyan.createLogger({ name: 'soapbubble-bot-socket' });

function fetchBotProfile() {
  return axios.get(`${config.authHost}/GetBotSettings`, {
    params: {
      token: config.auth.token,
    },
  })
    .then(({ data }) => {
      return data;
    });
}

export default function (app) {
  let client;
  let testClient;
  let gameSocket;
  const server = Server(app);
  const io = socketio(server);

  // io.set('origins', config.origins);
  io.origins((origin, callback) => {
    if (origin !== config.origins && origin !== '*') {
      return callback('origin not allowed', false);
    }
    callback(null, true);
  });
  io.on('error', err => logger.error(err));
  const uChannel = uuid();
  fetchBotProfile().then((data) => {
    io.on('connection', (socket) => {
      socket.on('test', (token, channel, cb) => {
        const messageHandler = actions({
          emit(...args) {
            if (gameSocket) {
              logger.info('Sending test response to game');
              gameSocket.emit(uChannel, ...args);
            } else {
              logger.warn('No game socket detected');
            }
          },
        });
        logger.info('Test client open at', channel);
        if (token === data.token) {
          logger.info('Test token matches');
          if (testClient) {
            testClient.removeAllListeners('message');
          }
          testClient = testClientFactory(socket, channel);
          testClient.on('message', messageHandler);
          cb();
        }
      });

      socket.on('letsplay', (channel) => {
        if (data.letsPlayChannel === channel) {
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
  });

  return {
    server,
    io,
    setClient(_client) {
      client = _client;
    },
  };
}
