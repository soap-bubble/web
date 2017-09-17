// The polyfill will emulate a full ES6 environment (for old browsers)
// (including generators, which means async/await)
import 'babel-polyfill';
import { render } from 'react-isomorphic-render';

import settings from './react-isomorphic-render';

import { timing } from './utils/analytics';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import '../assets/styles/main.scss';
import '../assets/styles/main.less';
import 'bootstrap-social/bootstrap-social.css';

require('react-responsive-ui/styles/react-responsive-ui.css');

const startRenderTime = Date.now();
// renders the webpage on the client side
render(settings,
  {
  // enable/disable Redux dev-tools
    devtools: REDUX_DEVTOOLS ? require('./devtools').default : undefined,
  })
  .then(({ store, rerender }) => {
    if (module.hot) {
      module.hot.accept('./react-isomorphic-render', () => {
        store.hotReload(settings.reducer);
        rerender();
      });
    }
  })
  .then(() => {
    timing('React', 'render', Date.now() - startRenderTime);
  });
