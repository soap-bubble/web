import selectorFactory from './selectors';
import reducer from './reducer';
import * as actions from './actions';
import PopOver from './containers/PopOver';

const selectors = selectorFactory(state => state.login);

export {
  selectors,
  actions,
  reducer,
  PopOver,
};
