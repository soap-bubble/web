const path = require('path');
const config = require('config');
const express = require('express');
const builder = require('service-builder');

const router = require('./router');

const blueprint = builder({
  app(router) {
    const app = express();
    app.use(router);
    return app;
  },
  config,
  router,
  routes(config) {
    return config.get('routes');
  },
  domains(config) {
    return Object.values(config.routes).map(r => r.host);
  },
  email(config) {
    return config.get('email');
  },
  isDebug(config) {
    const val = config.get('debug');
    if (val && val === 'false') {
      return false;
    }
    return !!val;
  },
  server(isDebug) {
    return isDebug ? 'https://acme-staging-v02.api.letsencrypt.org/directory' : 'https://acme-v02.api.letsencrypt.org/directory';
  },
  httpPort(config) {
    return Number(config.get('httpPort'));
  },
  httpsPort(config) {
    return Number(config.get('httpsPort'));
  },
  mongoUri(config) {
    return config.get('mongoUri');
  },
  httpChallenge(isDebug) {
    return require('le-challenge-standalone').create({
      debug: isDebug,
    });
  },
  greenlockOpts(app, store, email, httpChallenge, isDebug, server, domains) {
    return {
      app,
      email,
      server,
      store,
      debug: isDebug,
      challenges: {
        'http-01': httpChallenge,
      },
      configDir: path.resolve(__dirname, '.acme'),
      agreeTos: true,
      approvedDomains: domains,
      communityMember: false,
    };
  },
  greenlock(greenlockOpts) {
    return require('greenlock-express').create(greenlockOpts);
  },
  store(mongoUri, isDebug) {
    return require('le-store-mongodb').create({
      mongoUri,
      debug: isDebug,
    });
  },
});

const factory = blueprint.construct();

factory.$((greenlock, httpPort, httpsPort) => {
  console.log(`Listening on ${httpPort} and ${httpsPort}`);
  greenlock.listen(httpPort, httpsPort);
});
