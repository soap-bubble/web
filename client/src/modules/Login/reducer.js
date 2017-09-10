import {
  INIT,
  START,
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
