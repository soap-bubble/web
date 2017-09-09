import {
  pick,
} from 'lodash';
import bodyParser from 'body-parser';
import expressSession from 'express-session';
import passport from 'passport';
import connectMongo from 'connect-mongo';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const MongoStore = connectMongo(expressSession);

export default function installMiddleware(app, db, config, createLogger) {
  const logger = createLogger('middleware');
  logger.info('Installing middleware');


  passport.use(new GoogleStrategy(
    config.passport.strategies.google,
    ((accessToken, refreshToken, profile, cb) => {
      logger.info('Google login request', pick(profile, 'id', 'displayName'));
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
    }),
  ));

  passport.serializeUser((user, done) => {
    done(null, user.getId());
  });

  passport.deserializeUser((id, done) => {
    logger.info('Deserializing user');
    db.model('User').findOne({ _id: id })
      .then((user) => {
        done(null, user);
      })
      .catch(done);
  });

  app.use(bodyParser.json(config.bodyParser.json));
  app.use(expressSession({
    ...config.session,
    store: new MongoStore({ mongooseConnection: db }),
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  logger.info('Installing middleware -- complete');
}
