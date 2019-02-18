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

module.exports = function init(routes) {
  const router = new Router();
  for (let route of routes) {
    const {
      host,
      route: hostRoute,
      target,
    } = route;
    const middlewares = [];
    if (host || host.length) {
      middlewares.push(vhostDomainsRouter(host));
    }
    middlewares.push(proxy(target));
    router.use(hostRoute, ...middlewares);
  }
  return router;
}