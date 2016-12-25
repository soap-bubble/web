/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Vector3 } from 'three';

import store from './store';
import World from './react/presentations/World';
import { fetchScene, buildScene, buildRig, startRenderLoop } from './actions/scene';
import { positionCamera }  from './actions/three';
import { resize } from './actions/dimensions';

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

  store.dispatch(fetchScene(1050))
    .then(() => {
      store.dispatch(buildScene());
      store.dispatch(buildRig());
      resizeToWindow();
      store.dispatch(positionCamera({ z: -0.4 }));
      store.dispatch(startRenderLoop());
    });

  window.addEventListener('resize', () => {
    resizeToWindow();
  });
};
