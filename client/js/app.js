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
      scene.bySceneId(1010)
        .then(response => response.data)
        .then(pano.withCanvas(document.getElementById('morpheus')).forScene)
        .then(panoView => panoView.initBuffers().drawScene());
    });
    log.info('app:init');
  });
};
