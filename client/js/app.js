import 'babel-polyfill';
import qs from 'query-string';

import { bySceneId } from './service/scene';
import logger from './utils/logger';
import renderer from './three/render';

import test from './three/test';

const log = logger('app');
const qp = qs.parse(location.search);
// bySceneId(qp.scene || 1050)
//   .then(response => {
//     const { data } = response;
//     const canvas = document.getElementById('morpheus-3d');
//     test(canvas, data).animate();
//   });
log.info('app:init');

import createScene from './three/scene';

bySceneId(qp.scene || 1050)
  .then(response => {
    const { data } = response;
    const canvas = document.getElementById('morpheus-3d');
    const scene = createScene({
      canvas,
      data
    });
    const { camera, hotspots, pano } = scene;

    camera.position.z = -0.20;
    renderer(() => {
      hotspots.object3D.rotation.y += 0.005;
      pano.object3D.rotation.y += 0.005;
      scene.render();
    });
  })
    .catch(err => log.error(err));
