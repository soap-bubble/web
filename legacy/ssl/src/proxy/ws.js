module.exports = function init(rulesMap, proxy) {
  return (req, socket, head) => {
    const proxyRule = rulesMap[req.headers.host];
    if (proxyRule) {
      const target = proxyRule.match(req);
      if (target) {
        return proxy.ws(req, socket, head, {
          target,
          ...proxyRule.wsOrigin ? {
            headers: {
              'Origin': proxyRule.wsOrigin,
            }
          } : null,
        });
      }
    }
    socket.close();
  };
}
