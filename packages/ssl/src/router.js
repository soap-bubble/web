const proxy = require('express-http-proxy');
const { Router } = require('express');

// Only accepts connections whose `Host` header matches the provided domains.
function vhostDomainsRouter(configHost, cb) {
  const domains = Array.isArray(configHost) ? configHost : [configHost];
  return (req, res, next) => {
    if (domains.includes(req.headers.host)) {
      cb(req, res, next);
    } else {
      next();
    }
  };
}

function logRequest(req, res, next) {
  console.log(`${req.method} ${req.protocol}://${req.hostname}${req.path}`);
  next();
}

function redirectMiddleware(target) {
  return (req, res, next) => {
    if (['GET', 'POST'].includes(req.method)) {
      return res.redirect(`${target}${req.path}`);
    }
    next();
  }
}

module.exports = function init(routes, isDebug) {
  const router = new Router();
  for (let route of routes) {
    const {
      host,
      route: hostRoute,
      redirect,
      ssl,
      target,
    } = route;
    const middlewares = [];
    if (isDebug) {
      middlewares.push(logRequest);
    }
    let handler;
    if (host || host.length) {
      middlewares.push(
        vhostDomainsRouter(
          host,
          (req, res, next) => handler && handler(req, res, next) || next(),
        )
      );
    }
    if (target) {
      const proxyOpts = {};
      if (ssl === 'self') {
        proxyOpts.proxyReqOptDecorator = (proxyReqOpts, originalReq) => {
          proxyReqOpts.rejectUnauthorized = false
          return proxyReqOpts;
        };
      }
      handler = proxy(target, proxyOpts);
    } else if (redirect) {
      handler = redirectMiddleware(redirect);
    }

    router.use(hostRoute, ...middlewares);
  }
  return router;
}
