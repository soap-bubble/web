/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';

import store from './store';
import Scene from './react/containers/Scene';
import { fetchScene, sceneCreate } from './actions/scene';

window.onload = () => {
  render(
    <Provider store={store}>
      <Scene />
    </Provider>,
    document.getElementById('root'),
  );

  store.dispatch(fetchScene(1050))
    .then(() => {
      store.dispatch(sceneCreate());
    });
};
