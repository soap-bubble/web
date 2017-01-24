import createReducer from './createReducer';
import {
  CHANGE_PAGE,
} from '../actions/types';

const reducer = createReducer({
  current: 'examples',
  navItems: [{
    name: 'about',
    label: 'About'
  }, {
    name: 'examples',
    label: 'Gallery'
  }],
}, {
  [CHANGE_PAGE](page, { payload: current }) {
    return {
      ...page,
      current,
    };
  },
});

export default reducer;
