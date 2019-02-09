const path = require('path');
const config = require('config');
const express = require('express');
const builder = require('service-builder');

const blueprint = builder({
  app: express,
  config,
  domains(config) {
    return Object.values(config.routes).map(r => r.host);
  },
  email(config) {
    return config.get('email');
  },
  isDebug(config) {
    return config.get('debug');
  },
  httpChallenge(isDebug) {
    return require('le-challenge-standalone').create({
      debug: isDebug,
    });
  },
  greenlockOpts(app, isDebug, httpChallenge) {
    return {
      debug: isDebug,
      app,
      configDir: path.resolve(__dirname, '.acme'),
      challenges: {
        'http-01': httpChallenge,
      },
    };
  },
  greenlock(greenlockOpts) {
    return require('greenlock-express').create(greenlockOpts);
  },
  registerOpts(domains, email, isDebug) {
    return {
      debug: isDebug,
      domains,
      email,
      agreeTos: true,
      communityMember: false,
    };
  },
});


const factory = blueprint.construct();

factory.$((greenlock, domains, registerOpts) => {
  greenlock.listen(80, 443);
});
