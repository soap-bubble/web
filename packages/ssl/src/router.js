const proxy = require('express-http-proxy');
const { Router } = require('express');

// Only accepts connections whose `Host` header matches the provided domains.
function vhostDomainsRouter(configHost) {
  const domains = Array.isArray(configHost) ? configHost : [configHost];
  return (req, res, next) => {
    if (domains.includes(req.headers.host)) {
      next();
    }
  };
}

function logRequest(req, res, next) {
  console.log(`${req.method} ${req.protocol}://${req.hostname}${req.url}`);
  next();
}

module.exports = function init(routes, isDebug) {
  const router = new Router();
  for (let route of routes) {
    const {
      host,
      route: hostRoute,
      ssl,
      target,
    } = route;
    const middlewares = [];
    if (isDebug) {
      middlewares.push(logRequest);
    }
    if (host || host.length) {
      middlewares.push(vhostDomainsRouter(host));
    }
    const proxyOpts = {};
    if (ssl === 'self') {
      proxyOpts.proxyReqOptDecorator = (proxyReqOpts, originalReq) => {
        proxyReqOpts.rejectUnauthorized = false
        return proxyReqOpts;
      };
    }
    middlewares.push(proxy(target, proxyOpts));
    router.use(hostRoute, ...middlewares);
  }
  return router;
}
