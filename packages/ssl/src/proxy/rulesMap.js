const HttpProxyRules = require('http-proxy-rules');

module.exports = function init(rules, auths) {
  const rulesMap = rules.reduce((memo, {
    auth: authDef,
    host,
    rules,
    fallback,
    wsOrigin,
  }) => {
    const proxyRule = new HttpProxyRules({
      rules,
      default: fallback,
    });
    const auth = authDef ? authDef.reduce((memo, [authType, authOpts]) => {
      const [authFactory, authMiddleware] = auths(authType);
      const authImpl = authFactory(authOpts);
      return (req, res, next) => authMiddleware(authImpl, req, res, memo ? memo : next);
    }, null) : null;
    memo[host] = {
      match(req) {
        return proxyRule.match(req);
      },
      wsOrigin,
      auth,
    }
    return memo;
  }, {});
  return rulesMap;
}
