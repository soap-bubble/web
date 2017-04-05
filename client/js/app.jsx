/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import qs from 'query-string';

import store from './store';
import World from './react/World';
import { goToScene } from './actions/scene';
import { fetchInitial as fetchInitialGameState } from './actions/gameState';
import { resize } from './actions/dimensions';

const qp = qs.parse(location.search);

function resizeToWindow() {
  store.dispatch(resize({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
}

window.onload = () => {
  render(
    <Provider store={store}>
      <World />
    </Provider>,
    document.getElementById('root'),
  );

  store.dispatch(goToScene(qp.scene || 8010));
  store.dispatch(fetchInitialGameState());

  window.addEventListener('resize', () => {
    resizeToWindow();
  });
};
