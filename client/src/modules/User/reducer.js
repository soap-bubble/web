import {
  FETCH,
} from './actionTypes';

const defaultState = {
  settings: {
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
