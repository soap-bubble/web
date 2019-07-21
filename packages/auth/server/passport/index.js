import google from './google';
import oauth from './oauth';
import $ from '../factory';

export default ['createLogger', async function (createLogger) {
  const logger = createLogger('passport')
  logger.info('Installing passport');
  await $(google);
  await $(oauth);
  logger.info('Installing passport -- complete');
}]
