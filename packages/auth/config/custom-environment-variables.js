module.exports = {
  mongodb: {
    uri: 'MONGODB_URI',
  },
  cookie: {
    secret: 'COOKIE_SECRET',
  },
  session: {
    secret: 'SESSION_SECRET',
  },
  domain: 'AUTH_DOMAIN',
  cors: {
    origin: {
      __name: 'CORS_ORIGIN',
      __format: 'json',
    },
  },
  passport: {
    strategies: {
      google: {
        clientID: 'GOOGLE_CLIENT_ID',
        clientSecret: 'GOOGLE_SECRET',
        callbackURL: 'GOOGLE_CALLBACK_URL',
      },
    },
  },
  port: 'PORT',
};
