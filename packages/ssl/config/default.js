module.exports = {
  debug: false,
  httpPort: 80,
  httpsPort: 443,
  mongoUri: 'mongodb://mongo-cluster/greenlock?replicaSet=rs0',
  routes: [
    {
      host: 'morpheus.soapbubble.online',
      route: '/',
      redirect: 'https://soapbubble.online/morpheus',
    },
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
    }, {
      host: 'texascoc.net',
      route: '/',
      target: 'http://texascoc:8060',
    }, {
      host: 'johndeanresume.com',
      route: '/',
      target: 'http://branes:5000',
    }
  ],
};
