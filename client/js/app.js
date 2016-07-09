import './utils';
import './models/morpheus';
import './gl';

import wagner from 'wagner-core';

window.onload = function onAppInit() {
  wagner.invoke(function (logger) {
    const log = logger('app');
    // wagner.invoke((pano) => {
    //   pano
    //     .withCanvas(document.getElementById('morpheus'))
    //     .forUrl('/img/self.jpg');
    // });

    wagner.invoke((scene, pano) => {
      scene.bySceneId(1050)
        .then(response => response.data)
        .then(pano.withCanvas(document.getElementById('morpheus-3d')).forScene)
        .then(panoView => panoView.initBuffers().animate());
    });
    log.info('app:init');
  });
};
