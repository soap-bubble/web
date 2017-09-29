import createReducer from 'utils/createReducer';
import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
  KEY_INPUT,
} from './actionTypes';

const inputDefaults = {
  enabled: true,
  keyInput: null,
  interactionDebounce: 5,
  sensitivity: 50,
};

const reducer = createReducer(
  'input',
  inputDefaults,
  {
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
    [KEY_INPUT](state, { payload: keyInput }) {
      return {
        ...state,
        keyInput,
      };
    },
  },
);

export default reducer;
