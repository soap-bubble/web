import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer
} from 'three';

import createPano from './pano';
import createPanoCast from './panoCast';
import createHotspots from './hotspots';
import { singleton } from '../utils/object';

export function createCamera({ width, height }) {
  return new PerspectiveCamera( 55, width / height, 0.01, 1000 );
}

export function createRenderer({ canvas, width, height }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor( 0x000000, 0 );
  return renderer;
}

export function createScene3D({ hotspots, pano }) {
  const scene = new Scene();

  scene.add(hotspots.object3D);
  scene.add(pano.object3D);

  return scene;
}

export default function createScene({ canvas, data }) {
  const panoCastFactory = singleton(() => createPanoCast(selfie.casts.find(c => c.__t === 'PanoCast')));
  const panoFactory = singleton(() => createPano(selfie.panoCast));
  const hotspotsFactory = singleton(() => createHotspots(selfie.hotspotsData));
  const scene3DFactory = singleton (() => createScene3D(selfie));
  const rendererFactory = singleton(() => createRenderer(selfie));
  const cameraFactory = singleton(() => createCamera(selfie));

  const selfie = {
    get hotspotsData() {
      return selfie.casts.filter(c => c.castId === 0);
    },

    get casts() {
      const { casts } = selfie.data;
      return casts;
    },

    get panoCast() { return panoCastFactory(); },
    get pano() { return panoFactory(); },
    get hotspots() { return hotspotsFactory(); },
    get scene3D() { return scene3DFactory(); },
    get renderer() { return rendererFactory(); },
    get camera() { return cameraFactory(); },

    render() {
      selfie.renderer.render(selfie.scene3D, selfie.camera);
    },

    get data() {
      return data;
    },
    get canvas() {
      return canvas;
    },
    get width() {
      return selfie.canvas.width;
    },
    get height() {
      return selfie.canvas.height;
    }
  };
  return selfie;
}
