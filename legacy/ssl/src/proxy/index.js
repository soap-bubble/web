const httpProxy = require('http-proxy');

module.exports = function init(rulesMap) {
  const proxy = httpProxy.createServer({ ws: true, changeOrigin: true, xfwd: true });
  proxy.on('error', (err, req, socket) => {
    if (socket && socket.close) {
      socket.close();
    }
  });
  return proxy;
}
