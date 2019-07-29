

module.exports = function init(rulesMap, proxy, isDebug) {
  return (req, res) => {
    let proxyRule = rulesMap[req.headers.host];
    proxyRule = proxyRule || rulesMap['/default/'];
    if (proxyRule) {
      const target = proxyRule.match(req);
      if (target) {
        if (isDebug) {
          console.log(`${req.headers.host}/${req.url} => ${target}`);
        }
        const proxyHandler = () => proxy.web(req, res, {
          target,
        });
        if (proxyRule.auth) {
          return proxyRule.auth(req, res, proxyHandler);
        }
        return proxyHandler();
      }
    }
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  };
}
