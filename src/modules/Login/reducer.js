import {
  INIT,
  LOGIN,
  LOGOUT,
  SUCCESS,
  FAILURE,
  GOOGLE_API_INIT,
  GOOGLE_API_LOGGED_IN,
} from './actionTypes';

const defaultState = {
  initStatus: false,
  authGoogleClientId: '',
  started: false,
  loggedIn: false,
  message: '',
  ended: false,
  gapiConfig: null,
};

export default function loginReducer(state = defaultState, { type: action, payload, result }) {
  switch (action) {
    case `${INIT}_PENDING`: {
      return {
        ...state,
        initStatus: 'pending',
      };
    }
    case `${INIT}_SUCCESS`: {
      return {
        ...state,
        initStatus: true,
        authGoogleClientId: result.data,
      };
    }
    case `${INIT}_ERROR`: {
      return {
        ...state,
        initStatus: false,
      };
    }
    case `${LOGIN}_PENDING`: {
      return {
        ...state,
        initStatus: 'pending',
      };
    }
    case `${LOGIN}_SUCCESS`: {
      return {
        ...state,
        initStatus: 'success',
        loggedIn: true,
        user: result,
      };
    }
    case `${LOGIN}_ERROR`: {
      return {
        ...state,
        initStatus: 'error',
        loggedIn: false,
      };
    }
    case `${LOGOUT}_SUCCESS`: {
      return {
        ...state,
        initStatus: false,
        loggedIn: false,
        user: {},
      };
    }
    case SUCCESS: {
      return {
        ...state,
        loggedIn: true,
        ended: true,
      };
    }
    case FAILURE: {
      return {
        ...state,
        started: false,
        message: payload,
      };
    }
    case GOOGLE_API_INIT: {
      return {
        ...state,
        gapiConfig: payload,
      };
    }
    case GOOGLE_API_LOGGED_IN: {
      return {
        ...state,
        googleProfile: payload,
        loggedIn: true,
      };
    }
    default:
      return state;
  }
}
