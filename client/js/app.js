import './utils';
import './models/morpheus';
import './gl';
import './canvas';

import wagner from 'wagner-core';

window.onload = function onAppInit() {
  wagner.invoke(function (logger) {
    const log = logger('app');
    // wagner.invoke((pano) => {
    //   pano
    //     .withCanvas(document.getElementById('morpheus'))
    //     .forUrl('/img/self.jpg');
    // });

    // wagner.invoke((scene, sphere) => {
    //   scene.bySceneId(1050)
    //     .then(response => response.data)
    //     .then(sphere.withCanvas(document.getElementById('morpheus-3d')).forScene)
    //     .then(panoView => panoView.initBuffers().animate());
    // });

    wagner.invoke((hotspot, scene, pano) => {
      scene.bySceneId(1050)
        .then(response => response.data)
        .then(scene => {
          const canvas = document.getElementById('morpheus-3d');
          return Promise.all([
            hotspot.withCanvas(canvas).forScene(scene)
              .then(hotspotView => hotspotView.initBuffers().animate()),
            pano
              .withCanvas(canvas)
              .forScene(scene)
              .then(panoView => panoView.initBuffers().animate())
          ]);
        })
    });
    log.info('app:init');
  });
};
