import axios from 'axios';
import config from '../../config';
import {
  INIT,
  LOGIN,
  LOGOUT,
  GOOGLE_API_LOGGED_IN,
  GOOGLE_API_ERROR,
} from './actionTypes';

export default function () {
  function login(user) {
    return {
      type: `${LOGIN}_SUCCESS`,
      result: user,
    };
  }

  function logout() {
    return {
      type: LOGOUT,
    };
  }

  function init() {
    return {
      type: INIT,
    };
  }

  function googleLogin(payload) {
    return {
      type: GOOGLE_API_LOGGED_IN,
      payload,
    };
  }

  function googleLoginError(err) {
    return {
      type: GOOGLE_API_ERROR,
      payload: err,
    };
  }


  return {
    login,
    logout,
    init,
    googleLogin,
    googleLoginError,
  };
}
