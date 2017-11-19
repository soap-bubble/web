
import bodyParser from 'body-parser';
import uuid from 'uuid';
import expressSession from 'express-session';
import passport from 'passport';
import connectMongo from 'connect-mongo';
import cors from 'cors';

const MongoStore = connectMongo(expressSession);

export default function installMiddleware(app, db, config, createLogger) {
  const logger = createLogger('middleware');
  logger.info('Installing middleware');

  passport.serializeUser((user, done) => {
    logger.info('Serializing user', { user });
    if (!user.id && user._id) {
      logger.info('Patching user', { user });
      // patch user
      user.id = uuid();
      user.save()
        .then(() => {
          logger.info('User patched', { user });
          done(null, user.id);
        })
        .catch(done);
    } else {
      done(null, user.id);
    }
  });

  passport.deserializeUser((id, done) => {
    logger.info('Deserializing user', { id });
    db.model('User').findOne({ id })
      .then((user) => {
        logger.info('User logging in', { displayName: user.displayName });
        done(null, user);
      })
      .catch(done);
  });

  app.use(cors(config.cors));
  app.use(bodyParser.json(config.bodyParser.json));
  app.use(bodyParser.urlencoded({
    extended: true,
  }));
  app.use(expressSession({
    ...config.session,
    store: new MongoStore({ mongooseConnection: db }),
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  logger.info('Installing middleware -- complete');
}
