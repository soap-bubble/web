module.exports = {
  httpPort: 80,
  httpsPort: 443,
  mongoUri: 'mongodb://localhost/greenlock',
  routes: [
    {
      host: 'soapbubble.online',
      route: 'core',
      ssl: true,
    }, {
      host: 'docker.soapbubble.online',
      route: 'docker',
      ssl: true,
    }, {
      host: 'rancher.soapbubble.online',
      route: 'rancher',
      ssl: true,
    }, {
      host: 'rancher2.soapbubble.online',
      route: 'rancher',
      ssl: true,
    }, {
      host: 'morpheus.soapbubble.online',
      route: 'morpheus',
      ssl: true,
    },
  ],
};
