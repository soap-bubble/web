/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Vector3 } from 'three';
import qs from 'query-string';

import store from './store';
import World from './react/presentations/World';
import { fetchScene } from './actions/scene';
import { buildScene, buildRig, startRenderLoop, positionCamera } from './actions/pano';
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

  store.dispatch(fetchScene(qp.scene || 1050))
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
