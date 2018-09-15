import {
  omit,
} from 'lodash';
import createReducer from 'utils/createReducer';
import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
  KEY_DOWN,
  KEY_UP,
  CURSOR_SET_POS,
} from './actionTypes';

const inputDefaults = {
  enabled: true,
  interactionDebounce: 5,
  sensitivity: 50,
  pressedKeys: {},
  cursorScreenPos: {},
};

const reducer = createReducer(
  'input',
  inputDefaults,
  {
    [CURSOR_SET_POS](state, { payload: cursorScreenPos }) {
      return {
        ...state,
        cursorScreenPos,
      };
    },
    [DISABLE_CONTROL](state) {
      return {
        ...state,
        ...inputDefaults,
        enabled: false,
      };
    },
    [ENABLE_CONTROL](state) {
      return {
        ...state,
        enabled: true,
      };
    },
    [KEY_DOWN](state, { payload: key }) {
      return {
        ...state,
        pressedKeys: {
          ...state.pressedKeys,
          [key]: true,
        },
      };
    },
    [KEY_UP](state, { payload: key }) {
      return {
        ...state,
        pressedKeys: omit(state.pressedKeys, key),
      };
    },
  },
);

export default reducer;
