import { stdSerializers, ConsoleRawStream, createLogger } from 'browser-bunyan';

export default function factory(name) {
  return createLogger({
    name,
    streams: [{
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      stream: new ConsoleRawStream({ logByLevel: true }),
    }],
    serializers: stdSerializers,
  });
}
