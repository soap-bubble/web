import axios from 'axios';
import config from '../../config';
import {
  selectors as loginSelectors
} from './index';
import {
  INIT,
  START,
  LOGIN,
  LOGOUT,
  SUCCESS,
  FAILURE,
} from './actionTypes';

if (global) {
  global.checkStatus = function checkStatus(token) {
    axios.get(`${config.authServer}/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(response => console.log(response), response => console.error(response));
  };
}

export function checkLoginStatus() {
  return (dispatch, getState) => {
    if (loginSelectors.isLoggedIn(getState())) {
      // logged in...
      return Promise.resolve(loginSelectors.user(getState()));
    }
    dispatch({
      promise: () => {
        return new Promise((resolve, reject) => {
          const loginFrame = document.createElement('iframe');
          loginFrame.style.display = 'none';
          loginFrame.src = `${config.authServer}/login`;

          window.addEventListener('message', function receiveMessage({ origin, data }) {
            if (origin !== config.authServer) {
              return;
            }
            if (data.isLoggedIn) {
              resolve(data.user);
            } else {
              reject(new Error('Not authorized'));
            }
            window.removeEventListener('message', receiveMessage);
            document.body.removeChild(loginFrame);
          }, false);
          document.body.appendChild(loginFrame);
        });
      },
      event: LOGIN,
    });
  }
}

export function login(user) {
  return {
    type: `${LOGIN}_SUCCESS`,
    result: user,
  };
}

export function logout() {
  return {
    promise: () => {
      return new Promise((resolve, reject) => {
        const loginFrame = document.createElement('iframe');
        loginFrame.style.display = 'none';
        loginFrame.src = `${config.authServer}/logout`;

        window.addEventListener('message', function receiveMessage({ origin, data }) {
          if (origin !== config.authServer) {
            return;
          }
          if (data.isSignedOut) {
            resolve(true);
          } else {
            reject(new Error('Unable to sign out'));
          }
          window.removeEventListener('message', receiveMessage);
          document.body.removeChild(loginFrame);
        }, false);
        document.body.appendChild(loginFrame);
      });
    },
    event: LOGOUT,
  };
}

export function init() {
  return {
    promise: () => axios.get(`${config.authServer}/google/token`),
    event: INIT,
  };
}

export function tokenLogin(googleResponse) {
  return {
    promise: () => axios.get(`${config.authServer}/google/login/token`, {
      params: {
        access_token: googleResponse.accessToken,
      },
    }),
    event: START,
  };
}

export function tokinAwait() {
  return {
    promise: () => axios.get(`${config.authServer}/google/user`),
    event: LOGIN,
  };
}

export function googleLogin() {
  return (dispatch) => {
    dispatch({
      type: START,
    });
  };
}
