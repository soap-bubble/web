const path = require('path');
const config = require('config');
const builder = require('service-builder');
const http = require('http');
const https = require('https');
const spdy = require('spdy');

const proxy = require('./proxy');
const rulesMap = require('./proxy/rulesMap');
const proxyWeb = require('./proxy/web');
const proxyWs = require('./proxy/ws');

const blueprint = builder({
  config,
  proxy,
  rulesMap,
  proxyWeb,
  proxyWs,
  routes(config) {
    return config.get('routes');
  },
  rules(config) {
    return config.get('rules');
  },
  domains(rules) {
    return rules.map(r => r.host);
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
  mongoUri(config, isDebug) {
    return `${config.get('mongoUri')}${isDebug ? '-staging' : ''}`;
  },
  httpChallenge(isDebug) {
    return require('le-challenge-standalone').create({
      debug: isDebug,
    });
  },
  redir() {
    return require('redirect-https')();
  },
  greenlockOpts(store, email, httpChallenge, isDebug, server, domains) {
    return {
      approvedDomains: domains,
      email,
      server,
      store,
      debug: isDebug,
      challenges: {
        'http-01': httpChallenge,
      },
      agreeTos: true,
      communityMember: false,
    };
  },
  greenlock(greenlockOpts) {
    return require('greenlock').create(greenlockOpts);
  },
  store(mongoUri, isDebug) {
    return require('le-store-mongodb').create({
      mongoUri,
      debug: isDebug,
    });
  },
});

const factory = blueprint.construct();

factory.$((greenlock, httpPort, httpsPort, domains, redir, proxyWeb, proxyWs) => {
  console.log(`Listening on ${httpPort} and ${httpsPort} for ${domains.join(', ')}`);
  http.createServer(greenlock.middleware(redir)).listen(httpPort);
  const httpsServer = https.createServer(greenlock.tlsOptions, proxyWeb);
  httpsServer.listen(httpsPort);
  httpsServer.on('upgrade', proxyWs);
});
