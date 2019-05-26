import passport from 'passport';
import config from 'config';

export default function (baseRoute) {
  baseRoute.get('/status', passport.authenticate(), (req, res) => {
    if (req.user) {
      return res.status(200).send('logged in');
    }
    return res.status(403).send('not logged in');
  });

  baseRoute.get('/login', (req, res) => {
    res.render('login', {
      googleClientId: config.passport.strategies.google.clientID,
      tokenSignIn: '/google/login/token',
    });
  });

  baseRoute.get('/logout', (req, res) => {
    res.render('logout', {
      googleClientId: config.passport.strategies.google.clientID,
    });
  });
}
