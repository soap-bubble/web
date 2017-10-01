import axios from 'axios';
import config from '../../config';
import {
  INIT,
  START,
  LOGIN,
  LOGOUT,
  SUCCESS,
  FAILURE,
} from './actionTypes';

export default function (selectors) {
  const loginSelectors = selectors;

  function checkLoginStatus() {
    return (dispatch, getState) => {
      if (loginSelectors.isLoggedIn(getState())) {
        // logged in...
        return Promise.resolve(loginSelectors.user(getState()));
      }
      dispatch({
        promise: () => new Promise((resolve, reject) => {
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
        }),
        event: LOGIN,
      });
    };
  }

  function login(user) {
    return {
      type: `${LOGIN}_SUCCESS`,
      result: user,
    };
  }

  function logout() {
    return {
      promise: () => new Promise((resolve, reject) => {
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
      }),
      event: LOGOUT,
    };
  }

  function init() {
    return {
      promise: () => axios.get(`${config.authServer}/google/token`),
      event: INIT,
    };
  }

  function tokenLogin(googleResponse) {
    return {
      promise: () => axios.get(`${config.authServer}/google/login/token`, {
        params: {
          access_token: googleResponse.accessToken,
        },
      }),
      event: START,
    };
  }

  function tokenAwait() {
    return {
      promise: () => axios.get(`${config.authServer}/google/user`),
      event: LOGIN,
    };
  }

  function googleLogin() {
    return (dispatch) => {
      dispatch({
        type: START,
      });
    };
  }

  return {
    checkLoginStatus,
    login,
    logout,
    init,
    tokenLogin,
    tokenAwait,
    googleLogin,
  };
}
