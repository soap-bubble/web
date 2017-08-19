import bunyan from 'browser-bunyan';

export default function factory(name) {
  return bunyan.createLogger({
    name,
    streams: [{
      level: 'info',
      stream: new bunyan.ConsoleFormattedStream({ logByLevel: true }),
    }],
    serializers: bunyan.stdSerializers,
  });
}
