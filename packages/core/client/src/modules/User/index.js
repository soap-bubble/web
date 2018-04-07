import * as actions from './actions';
import Page from './containers/Page';
import selectorFactory from './selectors';
import reducer from './reducer';

const selectors = selectorFactory(state => state.user);

export {
  actions,
  Page,
  reducer,
  selectors,
};
