import io from 'socket.io-client';

export default function (config, createLogger) {
  const logger = createLogger('socket');
  logger.info('Connecting to bot');
  
  const socket = io(config.service.bot, {
    reconnect: true,
  });

  socket.on('connect', () => {
    logger.info('socket connected');
  });

  return socket;
}
