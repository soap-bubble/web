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
      }
    },
    saves: {
      title: 'Saves',
      data: {
        saves: [],
      },
    },
  },
  status: null,
  fetch: null,
};

export default function reducer(state = defaultState, { action, payload, result }) {
  switch (action) {
    case `${FETCH}_PENDING`: {
      return {
        ...state,
        status: 'fetching',
        fetch: payload,
      };
    }
    case `${FETCH}_SUCCESS`: {
      return {
        ...state,
        status: 'fetched',
        settings: result,
      };
    }
    case `${FETCH}_ERROR`: {
      return {
        ...state,
        status: 'error',
        error: result,
      };
    }
    default:
      return state;
  }
}
