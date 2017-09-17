import passport from 'passport';
import config from 'config';
import uuid from 'uuid';
import Events from 'events';
import GoogleAuth from 'google-auth-library';

const CLIENT_ID = config.passport.strategies.google.clientID;
const auth = new GoogleAuth();
const googleClient = new auth.OAuth2(CLIENT_ID, '', '');

export default function (app, db, config, createLogger) {
  const logger = createLogger('routes:google');
  // In memory events.... because I am not in the mood to set up anything better
  const events = new Events();

  app.post('/google/token', (req, res) => {
    const { idtoken: token } = req.body;
    logger.info('Requesting login token for google');
    googleClient.verifyIdToken(
        token,
        CLIENT_ID,
        function(err, login) {
          if (err) {
            return res.status(403).send('not authorized');
          }
          var payload = login.getPayload();
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
              logger.info('Found user', { id: user._id });
              if (user.profiles.find(p => p.providerType == 'google').id === userid) {
                return res.status(200).send({
                  id: user.id,
                  emails: user.emails,
                  displayName: user.displayName,
                  profiles: user.profiles,
                });
              }
              return res.status(400).send('Token not OK');
            })
            .catch(err => {
              return res.status(500).send('Token not OK');
            });
        });
  })

  app.get('/auth/me', passport.authenticate(), (req, res) => {
    res.status(200).send(req.user);
  });

  app.get('/google/token', (req, res) => {
    const awaitKey = uuid();
    req.session.googleLoginAwait = req.session.googleLoginAwait || awaitKey;
    logger.info('Getting google client ID', { session: req.session, uuid: req.session.googleLoginAwait });
    req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session', { err });
        return res.status(500).send({ err });
      }
      logger.info('Saving session', { session: req.session });
      return res.status(200).send(CLIENT_ID);
    });
  });

  app.get('/google/await', (req, res, next) => {
    function authenticate() {
      passport.authenticate('google', { scope: ['email'] }, (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return process.nextTick(authenticate);
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.status(200).send('Logged in');
        });
      })(req, res, next);
    }
    authenticate();
  });

  app.get('/google/login/await', (req, res) => {
    if (req.session.googleLoginAwait) {
      return res.status(200).send({
        displayName: req.user.displayName,
      });
    }
    const awaitKey = uuid();
    req.session.googleLoginAwait = req.session.googleLoginAwait || awaitKey;
    logger.info('Getting google client ID', { session: req.session, uuid: req.session.googleLoginAwait });
    return req.session.save((err) => {
      if (err) {
        logger.error('Failed to save session', { err });
        return res.status(500).send({ err });
      }
      logger.info('Waiting for login....', { session: req.session, uuid: req.session.googleLoginAwait });
      return events.once(req.session.googleLoginAwait, (user) => {
        res.status(200).send({
          displayName: user.displayName,
        });
      });
    });
  });

  app.get('/login/google', passport.authenticate('google', { scope: ['email'] }));
  app.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login/google' }),
    (req, res) => {
      const awaitKey = req.session.googleLoginAwait;
      if (awaitKey) {
        logger.info('Resolving login/await', { session: req.session, uuid: awaitKey });
        events.emit(awaitKey, req.user);
        delete req.session[awaitKey];
      }
      res.redirect('/usersTest');
    },
  );

  app.post(
    '/google/login/token',
    passport.authenticate('google-login-token'),
    (req, res) => {
      res.send(req.user);
    },
  );
}
