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

module.exports = function init(routes) {
  const router = new Router();
  router.use(logRequest);
  const middlewarePerRoute = {};
  for (let route of routes) {
    const {
      host,
      route: hostRoute,
      redirect,
      ssl,
      target,
    } = route;
    middlewarePerRoute[hostRoute] = middlewarePerRoute[hostRoute] || [];
    const middlewares = middlewarePerRoute[hostRoute];

    if (target) {
      const proxyOpts = {};
      if (ssl === 'self') {
        proxyOpts.proxyReqOptDecorator = (proxyReqOpts, originalReq) => {
          proxyReqOpts.rejectUnauthorized = false
          return proxyReqOpts;
        };
      }
      middlewares.push({
        host,
        type: 'proxy',
        middleware: vhostDomainsRouter(
          host,
          proxy(target, proxyOpts),
        ),
      });
    } else if (redirect) {
      middlewares.push({
        host,
        type: 'redirect',
        middleware: vhostDomainsRouter(
          host,
          redirectMiddleware(redirect),
        ),
      });
    }
  }
  for (let [path, middlewares] of Object.entries(middlewarePerRoute)) {
    for (let { middleware, type, host } of middlewares.filter(({ type }) => type === 'redirect')) {
      console.log(type, host, path);
      router.use(path, middleware);
    }
    for (let { middleware, type, host } of middlewares.filter(({ type }) => type === 'proxy')) {
      console.log(type, host, path);
      router.use(path, middleware);
    }
  }
  return router;
}
