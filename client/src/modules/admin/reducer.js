import {
  BOT_SETTINGS_INPUT,
  BOT_SETTINGS_SUBMIT,
  BOT_SETTINGS_CANCEL,
  BOT_FETCH_SUCCESS,
} from './actionTypes';

const defaultState = {
  bot: {
    current: {},
    input: {},
  },
};

export default function reducer(state = defaultState, { type, payload }) {
  switch (type) {
    case BOT_FETCH_SUCCESS: {
      return {
        ...state,
        bot: {
          ...state.bot,
          current: payload,
          input: payload,
        },
      };
    }
    case BOT_SETTINGS_INPUT: {
      return {
        ...state,
        bot: {
          ...state.bot,
          input: {
            ...state.bot.input,
            ...payload,
          },
        },
      };
    }
    case BOT_SETTINGS_SUBMIT: {
      return {
        ...state,
        bot: {
          ...state.bot,
          input: {},
          current: {
            ...state.bot.current,
            ...state.bot.input,
          },
        },
      };
    }
    case BOT_SETTINGS_CANCEL: {
      return {
        ...state,
        bot: {
          ...state.bot,
          input: {},
        },
      };
    }
    default: {
      return { ...state };
    }
  }
}
