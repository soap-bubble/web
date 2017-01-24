/* eslint-env browser */
import 'bootstrap/dist/css/bootstrap.min.css';

import '../assets/styles/main.scss';
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import routes from './routes';

global.jQuery = require ('jquery');
require ('bootstrap')

window.onload = () => {
  render(
    <Provider store={store}>
      {routes}
    </Provider>,
    document.getElementById('root'),
  );
};
