import {
  FETCH,
} from './actionTypes';

const defaultState = {
  settings: {
    profile: {
      title: 'Profile',
      forms: [{
        label: 'Alias',
        type: 'input-text-line',
        help: 'Who are you?',
        keyPath: 'username',
      }, {
        label: 'Anonymous',
        type: 'input-checkbox',
        help: 'Check to opt out of all personally identifying information storage',
        keyPath: 'anonymous',
      }],
      data: {
        username: '',
        anonymous: false,
      },
    },
    saves: {
      title: 'Saves',
      data: {
        saves: [],
      },
    },
  },
  requestCount: 0,
};

export default function reducer(state = defaultState, { action, result }) {
  switch (action) {
    case `${FETCH}_PENDING`: {
      return {
        ...state,
        error: null,
        requestCount: state.requestCount + 1,
      };
    }
    case `${FETCH}_SUCCESS`: {
      return {
        ...state,
        requestCount: state.requestCount - 1,
        result,
      };
    }
    case `${FETCH}_ERROR`: {
      return {
        ...state,
        requestCount: state.requestCount - 1,
        error: result,
      };
    }
    default:
      return state;
  }
}
