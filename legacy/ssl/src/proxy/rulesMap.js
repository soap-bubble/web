const HttpProxyRules = require('http-proxy-rules');

module.exports = function init(rules, auths, isDebug) {
  if (isDebug) {
    console.log(rules);
  }
  const rulesMap = rules.reduce((memo, {
    auth: authDef,
    host,
    rules,
    fallback,
    wsOrigin,
    default: isDefault,
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
    if (isDefault) {
      memo['/default/'] = {
        match(req) {
          return proxyRule.match(req);
        },
        wsOrigin,
        auth,
      }
    } else {
      memo[host] = {
        match(req) {
          return proxyRule.match(req);
        },
        wsOrigin,
        auth,
      }
    }

    return memo;
  }, {});
  return rulesMap;
}
