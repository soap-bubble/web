const httpProxy = require('http-proxy');

module.exports = function init(rulesMap) {
  const proxy = httpProxy.createServer({ ws: true, changeOrigin: true });
  proxy.on('error', (err, req, socket) => {
    socket.send(JSON.stringify({ error: 'not responding' }));
    socket.close();
  });
  return proxy;
}
