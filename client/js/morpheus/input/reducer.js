import createReducer from 'utils/createReducer';
import {
  DISABLE_CONTROL,
  ENABLE_CONTROL,
} from './actionTypes';

const inputDefaults = {
  enabled: true,
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
  },
);

export default reducer;
