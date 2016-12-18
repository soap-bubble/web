import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer
} from 'three';

import createPano from './pano';
import createPanoCast from './panoCast';
import createHotspots from './hotspots';
import loggerFactory from '../utils/logger';
import { singleton, logAccess } from '../utils/object';

const log = loggerFactory('THREE:scene');

export function createCamera({ width, height }) {
  log.info({ width, height}, 'Creating camera');
  return new PerspectiveCamera( 55, width / height, 0.01, 1000 );
}

export function createRenderer({ canvas, width, height }) {
  log.info({ canvas, width, height }, `Creating ${width}x${height} renderer`);
  const renderer = new WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor( 0x000000, 0 );
  return renderer;
}

export function createScene3D({ hotspots, pano }) {
  log.info({ hotspots, pano }, 'Creating THREE Scene');
  const scene = new Scene();

  scene.add(hotspots.object3D);
  scene.add(pano.object3D);

  return scene;
}

export default function createScene({ canvas, data }) {
  const panoCastFactory = singleton(() => createPanoCast(selfie.castsData));
  const panoFactory = singleton(() => createPano(selfie.panoCast));
  const hotspotsFactory = singleton(() => createHotspots(selfie.hotspotsData));
  const scene3DFactory = singleton (() => createScene3D(selfie));
  const rendererFactory = singleton(() => createRenderer(selfie));
  const cameraFactory = singleton(() => createCamera(selfie));
  let scene3D;

  const selfie = {
    get data() { return data; },
    get hotspotsData() { return selfie.casts.filter(c => c.castId === 0); },
    get castsData() { return selfie.casts.find(c => c.__t === 'PanoCast'); },
    get casts() { return selfie.data.casts; },

    get panoCast() { return panoCastFactory(); },
    get pano() { return panoFactory(); },
    get hotspots() { return hotspotsFactory(); },
    get renderer() { return rendererFactory(); },
    get camera() { return cameraFactory(); },

    render() {
      selfie.renderer.render(selfie.scene3D, selfie.camera);
    },

    get scene3D() { return scene3D; },
    get canvas() { return canvas; },
    get width() { return selfie.canvas.width; },
    get height() { return selfie.canvas.height; }
  };

  scene3D = createScene3D(selfie);

  return selfie;
}
