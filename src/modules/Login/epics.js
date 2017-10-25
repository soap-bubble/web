import { Observable } from 'rxjs';
import axios from 'axios';
import {
  INIT,
  GOOGLE_API_INIT,
  GOOGLE_API_LOGGED_IN,
} from './actionTypes';
import config from '../../config';

const window = global;

export default function (selectors) {
  const windowGapi$ = Observable
    .interval(99)
    .takeUntil(() => !window.gapi)
    .last();

  const gapiConfig$ = Observable.fromPromise(
    axios.get(`${config.authServer}/google/oauth`).then(res => res.data),
  );

  const initEpic = action$ => action$
    .ofType(INIT)
    .concat(windowGapi$)
    .mergeMap(() => gapiConfig$)
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

      return {
        type: GOOGLE_API_LOGGED_IN,
        payload: {
          profile: {
            googleId: basicProfile.getId(),
            imageUrl: basicProfile.getImageUrl(),
            email: basicProfile.getEmail(),
            name: basicProfile.getName(),
          },
          tokenId,
          accessToken,
        },
      };
    });

  return [initEpic, loggedInEpic];
}
