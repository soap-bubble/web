import bunyan from 'browser-bunyan';
import wagner from 'wagner-core';

export default function factory(name) {
  return bunyan.createLogger({
    name: "myapp",
    streams: [{
      level: 'info',
      stream: new bunyan.ConsoleRawStream({ logByLevel: true })
    }],
    serializers: bunyan.stdSerializers,
    src: true
  });
}

wagner.constant('logger', factory);
