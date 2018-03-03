import { stdSerializers, ConsoleFormattedStream, createLogger } from 'browser-bunyan';

export default function factory(name) {
  return createLogger({
    name,
    // streams: [{
    //   level: 'info',
    //   stream: new ConsoleFormattedStream({ logByLevel: true }),
    // }],
    // serializers: stdSerializers,
  });
}
