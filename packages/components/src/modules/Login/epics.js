import { Observable } from 'rxjs';
import 'rxjs/add/operator/concat';

import {
  INIT,
  LOGOUT,
  GOOGLE_API_INIT,
  GOOGLE_API_LOGGED_IN,
} from './actionTypes';

const window = global;

export default function (selectors, googleConfigProvider, loggedInDefer) {
  const windowGapi$ = Observable
    .interval(99)
    .takeUntil(() => !window.gapi)
    .last();

  const initEpic = action$ => action$
    .ofType(INIT)
    .concat(windowGapi$)
    .mergeMap(() => Observable.fromPromise(googleConfigProvider()))
    .map((gapiConfig) => {
      const dispatch = {
        type: GOOGLE_API_INIT,
        payload: gapiConfig,
      };
      return dispatch;
    });

  const loggedInEpic = (action$, store) => action$
    .ofType(GOOGLE_API_INIT)
    .mergeMap(() => Observable.fromPromise(new Promise((resolve, reject) => {
      window.gapi.load('auth2', () => {
        if (!window.gapi.auth2.getAuthInstance()) {
          const params = selectors.gapiConfig(store.getState());

          window.gapi.auth2.init(params).then(
            (res) => {
              if (res.isSignedIn.get()) {
                resolve(res.currentUser.get());
              }
            },
            err => reject(err),
          );
        }
      });
    })))
    .map((gUser) => {
      const basicProfile = gUser.getBasicProfile();
      const authResponse = gUser.getAuthResponse();
      const tokenObj = authResponse;
      const tokenId = tokenObj.id_token;
      const accessToken = tokenObj.access_token;
      const payload = {
        profile: {
          googleId: basicProfile.getId(),
          imageUrl: basicProfile.getImageUrl(),
          email: basicProfile.getEmail(),
          name: basicProfile.getName(),
        },
        tokenId,
        accessToken,
      };
      loggedInDefer.resolve(payload);
      return {
        type: GOOGLE_API_LOGGED_IN,
        payload,
      };
    });

  const logoutEpic = action$ => action$
    .ofType(LOGOUT)
    .mergeMap(() => global.gapi.auth2.getAuthInstance()
      .signOut())
    .map(() => ({
      type: `${LOGOUT}_SUCCESS`,
    }))
    .catch(err => ({
      type: `${LOGOUT}_ERROR`,
      payload: err,
    }));

  return [initEpic, loggedInEpic, logoutEpic];
}
