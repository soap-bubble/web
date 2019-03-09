module.exports = {
  debug: false,
  httpPort: 80,
  httpsPort: 443,
  mongoUri: 'mongodb://mongo-cluster/greenlock?replicaSet=rs0',
  routes: [
    {
      host: 'soapbubble.online',
      route: '/auth',
      target: 'http://auth:4000',
    }, {
      host: 'soapbubble.online',
      route: '/morpheus',
      target: 'http://morpheus:8050',
    }, {
      host: 'soapbubble.online',
      route: '/',
      target: 'http://core:8060',
    }
  ],
};
