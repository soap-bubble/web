const HttpProxyRules = require('http-proxy-rules');

module.exports = function init(rules) {
  const rulesMap = rules.reduce((memo, { host, rules, fallback, wsOrigin }) => {
    memo[host] = new HttpProxyRules({
      rules,
      default: fallback,
    });
    if (wsOrigin) {
      memo[host].__wsOrigin = wsOrigin;
    }
    return memo;
  }, {});
  return rulesMap;
}
