module.exports = {
  port: 4000,
  bodyParser: {},
  session: {
    saveUninitialized: false,
    resave: false,
    cookie: {
    },
  },
  passport: {
    strategies: {
      google: {
        callbackURL: '/api/google/callback',
        passReqToCallback: true,
      },
    },
  },
};
