import createReducer from './createReducer';
import {
  CHANGE_PAGE,
} from '../actions/types';

const reducer = createReducer({}, {
  [CHANGE_PAGE](page, { payload: current }) {
    return {
      ...page,
      current,
    };
  },
});

export default reducer;
