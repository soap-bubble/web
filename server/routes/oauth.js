import oauth2orize, { createServer } from 'oauth2orize';
import uuid from 'uuid/v4';

import passport from 'passport';

export default function (app, db, createLogger) {
  const logger = createLogger('routes:oauth');

  // Create OAuth 2.0 server
  const server = createServer();

  // Register serialialization and deserialization functions.
  //
  // When a client redirects a user to user authorization endpoint, an
  // authorization transaction is initiated. To complete the transaction, the
  // user must authenticate and approve the authorization request. Because this
  // may involve multiple HTTP request/response exchanges, the transaction is
  // stored in the session.
  //
  // An application must supply serialization functions, which determine how the
  // client object is serialized into the session. Typically this will be a
  // simple matter of serializing the client's ID, and deserializing by finding
  // the client by ID from the database.

  server.serializeClient((client, done) => done(null, client.id));

  server.deserializeClient((id, done) => {
    logger.info('Deserializing client for oauth', { id });
    db.model('Client').findOne({ _id: id })
      .then((user) => {
        logger.info('Client logged in', { id: user._id });
        done(null, user);
      })
      .catch(done);
  });

  // Register supported grant types.
  //
  // OAuth 2.0 specifies a framework that allows users to grant client
  // applications limited access to their protected resources. It does this
  // through a process of the user granting access, and the client exchanging
  // the grant for an access token.

  // Grant authorization codes. The callback takes the `client` requesting
  // authorization, the `redirectUri` (which is used as a verifier in the
  // subsequent exchange), the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application. The application issues a code, which is bound to these
  // values, and will be exchanged for an access token.

  server.grant(oauth2orize.grant.code((client, redirectUri, user, ares, done) => {
    const code = uuid();
    logger.info('Oauth grant', { clientId: client.id, userId: user.id, code });
    const AuthorizationCode = db.model('AuthorizationCode');
    const ac = new AuthorizationCode({
      client,
      user,
      code,
    });

    ac.save()
      .then(() => done(null, code))
      .catch(done);
  }));

  // Grant implicit authorization. The callback takes the `client` requesting
  // authorization, the authenticated `user` granting access, and
  // their response, which contains approved scope, duration, etc. as parsed by
  // the application. The application issues a token, which is bound to these
  // values.

  server.grant(oauth2orize.grant.token((client, user, ares, done) => {
    const token = uuid();
    logger.info('Oauth grant token', { clientId: client.id, userId: user.id, token });
    const AccessToken = db.model('AccessToken');
    const at = new AccessToken({
      token,
      client,
      user,
    });

    at.save()
      .then(() => done(null, token))
      .catch(done);
  }));

  // Exchange authorization codes for access tokens. The callback accepts the
  // `client`, which is exchanging `code` and any `redirectUri` from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the user who authorized the
  // code.

  server.exchange(oauth2orize.exchange.code((client, code, redirectUri, done) => {
    logger.info('Oauth exchange code', { clientId: client.id, code });
    db.model('AuthorizationCode').findOne({ code })
      .then((ac) => {
        if (ac.client.id !== client.id) {
          return done(null, false);
        }

        const token = uuid();
        const AccessToken = db.model('AccessToken');
        const at = new AccessToken({
          token,
          client,
          user,
        });

        return at.save()
          .then(() => done(null, token))
          .catch(done);
      });
  }));

  // Exchange the client id and password/secret for an access token. The callback accepts the
  // `client`, which is exchanging the client's id and password/secret from the
  // authorization request for verification. If these values are validated, the
  // application issues an access token on behalf of the client who authorized the code.

  server.exchange(oauth2orize.exchange.clientCredentials((client, scope, done) => {
    logger.info('Oauth exchange client credentials', { clientId: client.id, scope });
    db.model('Client').findOne({
      id: client.id,
    })
      .then((localClient) => {
        if (!localClient) {
          return done(null, false);
        }
        if (!localClient.secret === client.secret) {
          return done(null, false);
        }
        const token = uuid();
        const AccessToken = db.model('AccessToken');
        const at = new AccessToken({
          token,
          client,
        });

        return at.save()
          .then(() => done(null, token))
          .catch(done);
      });
  }));

  // User authorization endpoint.
  //
  // `authorization` middleware accepts a `validate` callback which is
  // responsible for validating the client making the authorization request. In
  // doing so, is recommended that the `redirectUri` be checked against a
  // registered value, although security requirements may vary accross
  // implementations. Once validated, the `done` callback must be invoked with
  // a `client` instance, as well as the `redirectUri` to which the user will be
  // redirected after an authorization decision is obtained.
  //
  // This middleware simply initializes a new authorization transaction. It is
  // the application's responsibility to authenticate the user and render a dialog
  // to obtain their approval (displaying details about the client requesting
  // authorization). We accomplish that here by routing through `ensureLoggedIn()`
  // first, and rendering the `dialog` view.

  const authorization = [
    server.authorization((clientId, redirectUri, done) => {
      logger.info('Oauth authorize', { clientId });
      db.model('Client').findOne({
        id: clientId,
      })
        .then((client) => {
          // WARNING: For security purposes, it is highly advisable to check that
          //          redirectUri provided by the client matches one registered with
          //          the server. For simplicity, this example does not. You have
          //          been warned.
          logger.info('Found client for oauth authorize', { clientId });
          return done(null, client, redirectUri);
        })
        .catch((err) => {
          logger.error('Oauth authorize error', { err });
          done(err);
        });
    }, (client, user, done) => {
      logger.info('Checking grant for oauth authorize', { clientId: client.id });
      // Check if grant request qualifies for immediate approval

      // Auto-approve
      if (client.isTrusted) return done(null, true);

      logger.info('Finding access token for oauth authorize', { clientId: client.id });
      return db.model('AccessToken').findOne({
        client,
        user,
      })
        .then((token) => {
          // Auto-approve
          if (token) return done(null, true);

          // Otherwise ask user
          return done(null, false);
        });
    }),
    (request, response) => {
      response.status(200).send('ok');
    },
  ];

  // User decision endpoint.
  //
  // `decision` middleware processes a user's decision to allow or deny access
  // requested by a client application. Based on the grant type requested by the
  // client, the above grant middleware configured above will be invoked to send
  // a response.

  const decision = [
    server.decision(),
  ];


  // Token endpoint.
  //
  // `token` middleware handles client requests to exchange authorization grants
  // for access tokens. Based on the grant type being exchanged, the above
  // exchange middleware will be invoked to handle the request. Clients must
  // authenticate when making requests to this endpoint.

  const token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler(),
  ];

  app.get('/oauth/decision', decision);
  app.post('/oauth/token', token);
  app.get('/oauth/auth', authorization);
}
