module.exports = {
  debug: false,
  httpEnabled: true,
  httpsEnabled: true,
  httpPort: 80,
  httpsPort: 443,
  store: 'mongodb', // or 'fs'
  mongoUri: 'mongodb://mongo-cluster/greenlock?replicaSet=rs0',
  certDir: `/certs`,
};

[{
  host: 'soapbubble.online',
  rules: {
    '/morpheus': 'http://morpheus:8050',
    '/auth': 'http://auth:5000',
    '/': 'http://core:8060',
  },
  fallback: 'http://core:8060',
}, {
  host: 'texascoc.net',
  rules: {
    '/': 'http://texascoc:8060'
  }
}, {
  host: 'johndeanresume.com',
  rules: {
    '/': 'http://branes:5000'
  }
}, {
  host: 'johndeanresume.com',
  rules: {
    '/': 'http://branes:5000'
  }
}, {
  host: 'formclank.soapbubble.online',
  auth: [
    ['basic', {
      "realm": "formclank.soapbubble.online",
      "file": "/auth/.htpasswd"
    }]
  ],
  rules: {
    '/': 'http://66.187.76.225:32555',
  }
}]
