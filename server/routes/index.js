import login from './login';
import google from './google';
import user from './user';
import oauth from './oauth';
import $ from '../factory';

export default function (app, createLogger) {
  const logger = createLogger('routes');
  logger.info('Installing routes');

  app.set('view engine', 'ejs');

  $(login);
  $(google);
  $(user);
  $(oauth);

  logger.info('Installing routes -- compelete');
}
