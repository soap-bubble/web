

module.exports = function init(rulesMap, proxy) {
  return (req, res) => {
    const proxyRule = rulesMap[req.headers.host];
    if (proxyRule) {
      const target = proxyRule.match(req);
      if (target) {
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
