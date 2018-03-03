import Events from 'events';
import bunyan from 'bunyan';

const logger = bunyan.createLogger({ name: 'soapbubble-bot-test' });

export default function (socket, channel) {
  logger.info('Creating new test server');
  const client = new Events();
  socket.on(channel, (content, cb) => {
    logger.info('Test message', content);
    client.emit('message', {
      author: {
        bot: false,
      },
      content,
      reply(message) {
        socket.emit(channel, message);
      },
    }, cb);
  });
  
  return client;
}
