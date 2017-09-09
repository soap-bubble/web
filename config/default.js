module.exports = {
  port: 4000,
  bodyParser: {},
  session: {
    saveUninitialized: false,
    resave: false,
    cookie: {
      httpOnly: true,
    },
  },
  passport: {
    strategies: {
      google: {
        callbackURL: '/googleOauthCallback',
      },
    },
  },
};
