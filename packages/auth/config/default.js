module.exports = {
  port: 4000,
  bodyParser: {},
  rootPath: '',
  session: {
    saveUninitialized: false,
    resave: false,
    cookie: {
    },
  },
  service: {
    bot: false,
  },
  passport: {
    strategies: {
      google: {
        passReqToCallback: true,
      },
    },
  },
};
