import genericPool from 'generic-pool';
import {
  createRenderer,
  createCamera,
} from 'utils/three';
import createCanvas from 'utils/canvas';

function createThreeWebGLResources() {
  const camera = createCamera();
  let width;
  let height;
  let canvas;
  let renderer
  const selfie = {
    get renderer() {
      if (!renderer) {
        if (!width || !height) {
          throw new Error('setSize frist');
        }
        renderer = createRenderer({
          canvas,
          width,
          height,
        });
      }
      return renderer;
    },
    camera,
    get canvas() {
      if (!canvas) {
        if (!width || !height) {
          throw new Error('setSize frist');
        }
        canvas = createCanvas({ width, height });
      }
      return canvas;
    },
    setSize({ width: w, height: h }) {
      width = w;
      height = h;
      if (renderer && canvas) {
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        canvas.width = w;
        canvas.height = h;
      }
    },
  };
  return selfie;
}

export default function createWebGLRendererPool() {
  const factory = {
    create() {
      return createThreeWebGLResources();
    },
    destroy(webgl) {
      const {
        renderer,
        camera,
      } = webgl;
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.context = null;
      renderer.domElement = null;
      camera.dispose();
      webgl.canvas = null;
    },
  };
  const opts = {
    min: 6,
    max: 18,
  };
  return genericPool.createPool(factory, opts);
}
