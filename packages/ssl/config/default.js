module.exports = {
  debug: false,
  httpPort: 80,
  httpsPort: 443,
  store: 'mongodb', // or 'fs'
  mongoUri: 'mongodb://mongo-cluster/greenlock?replicaSet=rs0',
  certDir: `/opt/certs`,
};
