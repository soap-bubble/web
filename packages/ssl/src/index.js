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
const proxyAuths = require('./proxy/auths');

function envTruthiness(val) {
  if (val && val === 'false') {
    return false;
  }
  return !!val;
}

const blueprint = builder({
  config,
  proxy,
  rulesMap,
  proxyWeb,
  proxyWs,
  auths: proxyAuths,
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
  certDir(config) {
    return config.get('certDir');
  },
  isDebug(config) {
    return envTruthiness(config.get('debug'));
  },
  isHttpEnabled(config) {
    return envTruthiness(config.get('httpEnabled'));
  },
  isHttpsEnabled(config) {
    return envTruthiness(config.get('httpsEnabled'));
  },
  storeType(config) {
    return config.get('store');
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
      approvedDomains: domains.map(d => d.split(':')[0]),
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
  storeMongodb(mongoUri, isDebug) {
    return require('le-store-mongodb').create({
      mongoUri,
      debug: isDebug,
    });
  },
  storeFs(certDir, isDebug) {
    return require('le-store-fs').create({
      configDir: certDir,
      debug: isDebug,
    });
  },
  store($, storeType) {
    if (storeType === 'mongodb') {
      return $(storeMongodb => storeMongodb);
    } else if (storeType === 'fs') {
      return $(storeFs => storeFs);
    }
    throw new Error(`${storeType} not mongodb or fs`);
  },
});

const factory = blueprint.construct();

factory.$(($, isHttpEnabled, isHttpsEnabled) => {
  if (isHttpEnabled && isHttpsEnabled) {
    $((greenlock, httpPort, httpsPort, domains, redir, proxyWeb, proxyWs) => {
      console.log(`Listening on ${httpPort} and ${httpsPort} for ${domains.join(', ')}`);
      http.createServer(greenlock.middleware(redir)).listen(httpPort);
      const httpsServer = https.createServer(greenlock.tlsOptions, proxyWeb);
      httpsServer.listen(httpsPort);
      httpsServer.on('upgrade', proxyWs);
    });
  } else if (isHttpEnabled) {
    $((httpPort, domains, proxyWeb, proxyWs) => {
      console.log(`Listening on ${httpPort} for ${domains.join(', ')}`);
      const httpServer = http.createServer(proxyWeb);
      httpServer.listen(httpPort);
      httpServer.on('upgrade', proxyWs);
    });
  } else if (isHttpsEnabled) {
    $((greenlock, httpsPort, domains, proxyWeb, proxyWs) => {
      console.log(`Listening on ${httpsPort} for ${domains.join(', ')}`);
      const httpsServer = https.createServer(greenlock.tlsOptions, proxyWeb);
      httpsServer.listen(httpsPort);
      httpsServer.on('upgrade', proxyWs);
    });
  } else {
    console.log('Must enable either HTTP or HTTPS');
    process.exit(1);
  }
})
