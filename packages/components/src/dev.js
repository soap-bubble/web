import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import builder from 'service-builder';

import storeFactory from './store';
import login from './modules/Login';

const loginFactory = login({
  rootSelector: state => state.login,
});

const blueprint = builder({
  reducers: () => ({
    login: loginFactory.reducer,
  }),
  store: storeFactory,
});

blueprint.construct().$((store) => {
  'ngInject';

  render(
    <Provider store={store}>
      <loginFactory.Google onLogin={user => console.log(user)} />
    </Provider>,
    document.getElementById('root'),
  );
});
