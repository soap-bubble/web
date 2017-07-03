/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import qs from 'query-string';

// Loads all modules
import 'morpheus';

// Then pull out the stuff we need
import { actions as sceneActions } from 'morpheus/scene';
import { actions as gamestateActions } from 'morpheus/gamestate';
import { actions as gameActions } from 'morpheus/game';
import store from 'store';
import Game from 'react/Game';

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
      <Game />
    </Provider>,
    document.getElementById('root'),
  );
  store.dispatch(gameActions.resize({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  store.dispatch(gamestateActions.fetchInitial())
    .then(() => store.dispatch(sceneActions.goToScene(qp.scene || 8010)));

  window.addEventListener('resize', () => {
    resizeToWindow();
  });
};
