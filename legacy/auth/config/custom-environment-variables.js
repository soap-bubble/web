module.exports = {
  mongodb: {
    uri: 'AUTH_MONGODB_URI',
    username: 'MONGODB_USERNAME',
    password: 'MONGODB_PASSWORD',
  },
  cookie: {
    secret: 'AUTH_COOKIE_SECRET',
  },
  session: {
    secret: 'AUTH_SESSION_SECRET',
  },
  cors: {
    origin: {
      __name: 'AUTH_CORS_ORIGIN',
      __format: 'json',
    },
  },
  service: {
    bot: 'AUTH_SERVICE_BOT',
  },
  rootPath: 'AUTH_ROOT_PATH',
  passport: {
    strategies: {
      google: {
        clientID: 'AUTH_GOOGLE_CLIENT_ID',
        clientSecret: 'AUTH_GOOGLE_SECRET',
        callbackURL: 'AUTH_GOOGLE_CALLBACK_URL',
      },
      twitch: {
        clientID: 'BOT_TWITCH_CLIENT_ID',
        clientSecret: 'BOT_TWITCH_CLIENT_SECRET',
        callbackURL: 'BOT_TWITCH_CALLBACK_URL',
      }
    },
  },
  port: 'AUTH_PORT',
};
