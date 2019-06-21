const httpProxy = require('http-proxy');

module.exports = function init(rulesMap) {
  const proxy = httpProxy.createServer({ ws: true, changeOrigin: true });
  proxy.on('error', (err, req, res) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not responding' }));
  });
  return proxy;
}
