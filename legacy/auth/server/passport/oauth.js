import passport from 'passport';
import { BasicStrategy } from 'passport-http';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';
import { Strategy as BearerStrategy } from 'passport-http-bearer';

export default function (db, createLogger) {
  const logger = createLogger('passport:oauth');

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    db.model('User').findOne({
      id,
    })
      .then((user) => {
        done(null, user);
      })
      .catch(done);
  });

  /**
   * BasicStrategy & ClientPasswordStrategy
   *
   * These strategies are used to authenticate registered OAuth clients. They are
   * employed to protect the `token` endpoint, which consumers use to obtain
   * access tokens. The OAuth 2.0 specification suggests that clients use the
   * HTTP Basic scheme to authenticate. Use of the client password strategy
   * allows clients to send the same credentials in the request body (as opposed
   * to the `Authorization` header). While this approach is not recommended by
   * the specification, in practice it is quite common.
   */
  function verifyClient(clientId, clientSecret, done) {
    logger.info('Verify client', { clientId });
    db.model('Client').findOne({
      id: clientId,
      secret: clientSecret,
    })
      .then((client) => {
        if (!client) return done(null, false);
        if (client.secret !== clientSecret) return done(null, false);
        logger.info('Verify client success', { clientId });
        return done(null, client);
      })
      .catch(done);
  }

  passport.use(new BasicStrategy(verifyClient));
  passport.use(new ClientPasswordStrategy(verifyClient));

  /**
   * BearerStrategy
   *
   * This strategy is used to authenticate either users or clients based on an access token
   * (aka a bearer token). If a user, they must have previously authorized a client
   * application, which is issued an access token to make requests on behalf of
   * the authorizing user.
   */
  passport.use(new BearerStrategy((accessToken, done) => {
    db.model('AccessToken').findOne({
      token: accessToken,
    })
      .then((token) => {
        if (!token) return done(null, false);
        if (token.user.id) {
          return db.model('User').findOne({
            id: token.user.id,
          })
            .then((user) => {
              if (!user) return done(null, false);
              // To keep this example simple, restricted scopes are not implemented,
              // and this is just for illustrative purposes.
              return done(null, user, { scope: '*' });
            })
            .catch(done);
        }
        // The request came from a client only since userId is null,
        // therefore the client is passed back instead of a user.
        return db.model('Client').findOne({
          id: token.clientId,
        })
          .then((client) => {
            if (!client) return done(null, false);
            // To keep this example simple, restricted scopes are not implemented,
            // and this is just for illustrative purposes.
            return done(null, client, { scope: '*' });
          });
      })
      .catch(done);
  }));
}
