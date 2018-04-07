import Page from './containers/Page';
import Users from './containers/AdminUsers';
import Bot from './containers/Bot';
import actions from './actions';
import reducer from './reducer';
import selectorsFactory from './selectors';
import './epics';

const selectors = selectorsFactory(state => state.admin);

export {
  actions,
  Bot,
  Page,
  Users,
  selectors,
  reducer,
};
