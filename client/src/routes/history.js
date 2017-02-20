import { browserHistory, createMemoryHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import isNode  from 'detect-node';
import store from '../store';

let history = createMemoryHistory;
if (!isNode) {
  history = syncHistoryWithStore(browserHistory, store);
  history.listen(({ pathname }) => {
    if (window && window.ga) {
      const { ga } = window;
      ga('set', 'page', pathname);
      ga('send', 'pageview');
    }
  });
}

export default history;
