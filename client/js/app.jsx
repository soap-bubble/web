/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Vector3 } from 'three';

import store from './store';
import Scene from './react/containers/Scene';
import { fetchScene } from './actions/scene';
import { createPano } from './actions/pano';
import { createHotspots } from './actions/hotspots';
import { createScene } from './actions/three';
import renderer from './three/render';
import { resize } from './actions/dimensions';

window.onload = () => {
  render(
    <Provider store={store}>
      <Scene />
    </Provider>,
    document.getElementById('root'),
  );

  store.dispatch(fetchScene(1050))
    .then(() => {
      store.dispatch(createPano());
      store.dispatch(createHotspots());
      const objects = [];
      objects.push(store.getState().pano.object3D);
      objects.push(store.getState().hotspots.object3D);
      store.dispatch(createScene(objects));
    });

  document.body.addEventListener('resize', () => {
    store.dispatch(resize({
      width: window.innerWidth,
      height: window.innerHeight,
    }));
  });
};
