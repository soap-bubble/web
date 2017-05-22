/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import qs from 'query-string';
import { actions as sceneActions } from 'morpheus/scene';
import { actions as gamestateActions } from 'morpheus/gamestate';
import { actions as gameActions } from 'morpheus/game';
import store from 'store';
import World from 'react/World';

const qp = qs.parse(location.search);

function resizeToWindow() {
  store.dispatch(gameActions.resize({
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

  store.dispatch(sceneActions.goToScene(qp.scene || 8010));
  store.dispatch(gamestateActions.fetchInitial());

  window.addEventListener('resize', () => {
    resizeToWindow();
  });
};
