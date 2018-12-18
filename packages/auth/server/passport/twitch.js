import {
  pick,
  endsWith,
} from 'lodash';
import passport from 'passport';
import { Strategy as BaseStrategy } from 'passport-strategy';
import { Strategy as TwitchStategy } from 'passport-twitch';
import config from 'config';

function createOrUpdateBot(req, db, logger, accessToken, refreshToken, profile, cb) {
  const Bot = db.model('Bot');
  logger.info('Looking for bot settings');
  Bot.findOne()
    .then((bot) => {
      if (!bot) {
        logger.info('No bot settings found, creating new one');
        const bot = new Bot({
          twitchTokenAccess: accessToken,
          twitchTokenRefresh: refreshToken,
          twitchTokenName: profile.name,
        });
        return bot.save();
      }
      return bot.save({
        twitchTokenAccess: accessToken,
        twitchTokenRefresh: refreshToken,
        twitchTokenName: profile.name,
      });
    }, (err) => {
      logger.error('Failed to find bot model', { profile, err });
      cb(err);
    })
    .then((user) => {
      cb(null, user);
    })
    .catch((err) => {
      logger.error('Failed to save bot model.', { err });
      cb(err);
    });
}

export default function (db, createLogger) {
  const logger = createLogger('passport:twitch');

  passport.use(new TwitchStategy(
    config.passport.strategies.twitch,
    ((req, accessToken, refreshToken, profile, cb) => {
      logger.info('Twitch auth request');
      createOrUpdateBot(req, db, logger, accessToken, refreshToken, profile, cb);
    }),
  ));
}
