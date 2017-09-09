import user from './user';
import login from './login';
import $ from '../factory';

export default function (app, createLogger) {
  const logger = createLogger('routes');
  logger.info('Installing routes');
  $(user);
  $(login);
  logger.info('Installing routes -- compelete');
}
