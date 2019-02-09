const path = require('path');

var leChallenge = require('le-challenge-route53').create({
  zone: 'soapbubble.online.', // required
  delay: 20000, // ms to wait before allowing letsencrypt to check dns record (20000 ms is the default)
  debug: true,
});

/////////////////////
// SET USER PARAMS //
/////////////////////

var opts = {
  debug: true,
  domains: [ '*.soapbubble.online', 'soapbubble.online' ],
  email: 'morpheus.dev@soapbubble.online',
  challenge: leChallenge,
  agreeTos: true,                 // Accept Let's Encrypt v2 Agreement
  communityMember: false,         // Help make Greenlock better by submitting
                                  // stats and getting updates
};

////////////////////
// INIT GREENLOCK //
////////////////////

var greenlock = require('greenlock').create({
  // version: 'draft-12',
  // server: 'https://acme-v02.api.letsencrypt.org/directory',
  server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
  // configDir: path.resolve(__dirname, 'acme'),
  debug: true,
});


///////////////////
// GET TLS CERTS //
///////////////////

greenlock.check({ domains: [ '*.soapbubble.online' ] }).then(function (results) {
  if (results) {
    console.log(results);
    process.exit();
  }
  console.log('> register');
  greenlock.register(opts).then(function (certs) {
    console.log(certs);
    // privkey, cert, chain, expiresAt, issuedAt, subject, altnames
  }, function (err) {
    console.error(err);
  });
}, err => console.error(err));



console.log('start')
