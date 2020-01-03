import { stdSerializers, ConsoleRawStream, createLogger } from 'browser-bunyan';
import isDebug from './isDebug';


export default function factory(name: string) {
  return createLogger({
    name,
    streams: [{
      level: isDebug ? 'debug' : 'warn',
      stream: new ConsoleRawStream({ logByLevel: true }),
    }],
    serializers: stdSerializers,
  });
}
