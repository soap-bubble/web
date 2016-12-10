import './utils';
import { bySceneId } from './models/morpheus';
import threeTest from './three/test';

import wagner from 'wagner-core';

window.onload = function onAppInit() {
  wagner.invoke(function (logger) {
    const log = logger('app');
    bySceneId(1050)
      .then(response => {
        const { data } = response;
        const canvas = document.getElementById('morpheus-3d');
        threeTest(canvas, data).animate();
      });
    log.info('app:init');
  });
};
