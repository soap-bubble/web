/* eslint-env browser */
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Vector3 } from 'three';
import qs from 'query-string';

import store from './store';
import World from './react/World';
import { goToScene } from './actions/scene';
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

  // if (qp.video) {
  //   const
  // }

  store.dispatch(goToScene(qp.scene || 1050));

  window.addEventListener('resize', () => {
    resizeToWindow();
  });
};
