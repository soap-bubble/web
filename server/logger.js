import bunyan from 'bunyan';
import PrettyStream from 'bunyan-prettystream';

let prettyStdOut;

if (process.NODE_ENV !== 'production') {
  prettyStdOut = new PrettyStream();
  prettyStdOut.pipe(process.stdout);
}

export default function createLogger(name) {
  const options = { name };
  if (process.NODE_ENV !== 'production') {
    options.streams = [{
      level: 'debug',
      type: 'raw',
      stream: prettyStdOut,
    }];
  }
  return bunyan.createLogger(options);
}
