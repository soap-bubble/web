import {
  pick,
} from 'lodash';
import passport from 'passport';
import { Strategy as BaseStrategy } from 'passport-strategy';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as GoogleTokenStrategy } from 'passport-google-token';
import GoogleAuth from 'google-auth-library';
import config from 'config';

const CLIENT_ID = config.passport.strategies.google.clientID;
const auth = new GoogleAuth();
const googleClient = new auth.OAuth2(CLIENT_ID, '', '');

function createOrUpdateGoogleUser(req, db, logger, profile, cb) {
  logger.info('Looking for google user');
  const User = db.model('User');
  User.findOne({
    profiles: {
      $elemMatch: {
        providerType: 'google',
        id: profile.id,
      },
    },
  })
    .then((user) => {
      if (!user) {
        logger.info('No user found');
        const userModel = new User({
          emails: profile.emails.map(({ type: emailType, value }) => ({
            emailType,
            value,
          })),
          displayName: profile.displayName,
          profiles: [{
            providerType: 'google',
            id: profile.id,
          }],
        });
        return userModel.save().then(() => {
          logger.info('Saving new user model');
          return userModel;
        });
      }
      logger.info('Found existing user', { user });
      return user;
    }, (err) => {
      logger.error('Failed to find user model', { profile, err });
      cb(err);
    })
    .then((user) => {
      cb(null, user);
    })
    .catch((err) => {
      logger.error('Failed to save user model.', { err });
      cb(err);
    });
}

export default function (db, config, createLogger) {
  const logger = createLogger('provider:google');

  // passport.use(new GoogleTokenStrategy(
  //   config.passport.strategies.google,
  //   ((req, accessToken, refreshToken, profile, cb) => {
  //     logger.info('Google token login request', pick(profile, 'id', 'displayName'));
  //     createOrUpdateGoogleUser(req, db, logger, profile, cb);
  //   }),
  // ));

  passport.use(new GoogleStrategy(
    config.passport.strategies.google,
    ((req, accessToken, refreshToken, profile, cb) => {
      logger.info('Google login request', pick(profile, 'id', 'displayName'));
      createOrUpdateGoogleUser(req, db, logger, profile, cb);
    }),
  ));

  class GoogleTokenStrategy extends BaseStrategy {
    constructor() {
      super();
      this.name = 'google-login-token';
    }
    authenticate(req) {
      const { idtoken: token } = req.body;
      logger.info('Requesting login token for google', { token });
      googleClient.verifyIdToken(
          token,
          CLIENT_ID,
          (err, login) => {
            if (err) {
              this.fail('not authorized');
            }
            var payload = login.getPayload();
            logger.info({ payload });
            const { sub: userid } = payload;
            db.model('User').findOne({
              profiles: {
                $elemMatch: {
                  providerType: 'google',
                  id: userid,
                },
              },
            })
              .then(user => {
                if (!user) {
                  const { email, name: displayName } = payload;
                  logger.info('No user found', { email, displayName });
                  const User = db.model('User');
                  const userModel = new User({
                    emails: [{
                      emailType: 'account',
                      value: email,
                    }],
                    displayName,
                    profiles: [{
                      providerType: 'google',
                      id: userid,
                    }],
                  });
                  logger.info('Saving new user', { userModel });
                  return userModel.save().then(() => {
                    logger.info('Saving new user model -- complete');
                    return userModel;
                  });
                }
                logger.info('Found user', { id: user.id });
                if (user.profiles.find(p => p.providerType == 'google').id === userid) {
                  logger.info('success');
                  this.success(user);
                } else {
                  logger.info('fail');
                  this.fail('User not found');
                }
              })
              .catch(err => {
                this.fail('Token error');
              });
          });
    }
  }

  passport.use(new GoogleTokenStrategy());
}
