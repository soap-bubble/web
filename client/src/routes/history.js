import { browserHistory, createMemoryHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import isNode from 'detect-node';
import store from '../store';

if (!isNode) {
  syncHistoryWithStore(browserHistory, store).listen(({ pathname }) => {
    if (window && window.ga) {
      const { ga } = window;
      ga('set', 'page', pathname);
      ga('send', 'pageview');
    }
  })
}

const history = isNode ? createMemoryHistory() : browserHistory;

export default history;
