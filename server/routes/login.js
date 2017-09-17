import passport from 'passport';
import config from 'config';

export default function (app) {
  app.get('/status', passport.authenticate(), (req, res) => {
    if (req.user) {
      return res.status(200).send('logged in');
    }
    return res.status(403).send('not logged in');
  });

  app.get('/login', (req, res) => {
    res.render('login', {
      googleClientId: config.passport.strategies.google.clientID,
      tokenSignIn: '/google/login/token',
    });
  });

  app.get('/logout', (req, res) => {
    res.render('logout', {
      googleClientId: config.passport.strategies.google.clientID,
    });
  });
}
