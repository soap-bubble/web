import {
  SPECIAL_START,
  SPECIAL_END,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  data: {},
  url: '',
}, {
  [SPECIAL_START](special, { payload: sceneData, meta: url }) {
    return {
      ...special,
      data: sceneData,
      url
    };
  },
  [SPECIAL_END](special) {
    return {
      ...special,
      data: {},
      url: '',
    };
  },
});

export default reducer;
