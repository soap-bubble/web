import login from './login';
import google from './google';
import twitch from './twitch';
import user from './user';
import oauth from './oauth';
import saves from './saves';
import bot from './bot';

import $ from '../factory';

function attempt(name, handler, logger) {
  try {
    $(handler);
  } catch (err) {
    logger.error(`Failed to install ${name}`, err);
  }
}

export default function (app, createLogger) {
  const logger = createLogger('routes');
  logger.info('Installing routes');

  app.set('view engine', 'ejs');

  app.get('/healthcheck', (req, res) => res.status(200).send('OK'));
  attempt('login', login, logger);
  attempt('google', google, logger);
  attempt('user', user, logger);
  attempt('oauth', user, logger);
  attempt('saves', saves, logger);
  attempt('bot', bot, logger);
  attempt('twitch', twitch, logger);

  logger.info('Installing routes -- compelete');
}
