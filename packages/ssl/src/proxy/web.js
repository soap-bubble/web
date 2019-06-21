module.exports = function init(rulesMap, proxy) {
  return (req, res) => {
    const proxyRule = rulesMap[req.headers.host];
    if (proxyRule) {
      const target = proxyRule.match(req);
      if (target) {
        return proxy.web(req, res, {
          target,
        });
      }
    }
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
  };
}
