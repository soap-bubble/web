import {
  INIT,
  START,
  LOGIN,
  LOGOUT,
  SUCCESS,
  FAILURE,
} from './actionTypes';

const defaultState = {
  initStatus: false,
  authGoogleClientId: '',
  started: false,
  loggedIn: false,
  message: '',
  ended: false,
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
    case START: {
      return {
        ...state,
        started: true,
        ended: false,
        message: '',
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
    default:
      return state;
  }
}
