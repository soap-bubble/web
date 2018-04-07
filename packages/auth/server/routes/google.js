import passport from 'passport';
import GoogleAuth from 'google-auth-library';

export default function (app, db, config, createLogger) {
  const CLIENT_ID = config.passport.strategies.google.clientID;
  const auth = new GoogleAuth();
  const googleClient = new auth.OAuth2(CLIENT_ID, '', '');

  const logger = createLogger('routes:google');

  app.post('/google/token', (req, res) => {
    const { idtoken: token } = req.body;
    logger.info('Requesting login token for google');
    googleClient.verifyIdToken(
      token,
      CLIENT_ID,
      (err, login) => {
        if (err) {
          return res.status(403).send('not authorized');
        }
        const payload = login.getPayload();
        const { sub: userid } = payload;
        return db.model('User').findOne({
          profiles: {
            $elemMatch: {
              providerType: 'google',
              id: userid,
            },
          },
        })
          .then((user) => {
            logger.info('Found user', { id: user._id });
            if (user.profiles.find(p => p.providerType === 'google').id === userid) {
              return res.status(200).send({
                id: user.id,
                emails: user.emails,
                displayName: user.displayName,
                profiles: user.profiles,
              });
            }
            return res.status(400).send('Token not OK');
          })
          .catch(() => res.status(500).send('Token not OK'));
      },
    );
  });

  app.get('/auth/me', passport.authenticate(), (req, res) => {
    res.status(200).send(req.user);
  });

  app.get('/google/oauth', (req, res) => {
    res.status(200).send({
      client_id: config.passport.strategies.google.clientID,
      redirect_uri: config.passport.strategies.google.callbackURL,
    });
  });

  app.get('/login/google', passport.authenticate('google', { scope: ['email'] }));
  app.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login/google' }),
    (req, res) => {
      logger.info('Received callback from google');
      res.redirect('/usersTest');
    },
  );

  app.get(
    '/google/login/token',
    passport.authenticate('google-login-token'),
    (req, res) => {
      res.send(req.user);
    },
  );
}
