import passport from 'passport';

export default function (app) {
  app.get('/login/google', passport.authenticate('google', { scope: ['email'] }));
  app.get(
    '/googleOauthCallback',
    passport.authenticate('google', { failureRedirect: '/login/google' }),
    (req, res) => {
      res.redirect('/usersTest');
    },
  );
}
