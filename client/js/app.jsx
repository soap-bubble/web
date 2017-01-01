/* eslint-env browser */
import 'bootstrap/dist/css/bootstrap.min.css';
import '../less/main.less';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import Contents from './views/Contents';

global.jQuery = require ('jquery');
require ('bootstrap')

window.onload = () => {
  render(
    <Provider store={store}>
      <Contents />
    </Provider>,
    document.getElementById('root'),
  );
};
