import genericPool from 'generic-pool';
import {
  createRenderer,
  createCamera,
} from 'utils/three';
import createCanvas from 'utils/canvas';

function createThreeWebGLResources({
  width,
  height,
}) {
  const canvas = createCanvas({ width, height });
  const camera = createCamera();
  const renderer = createRenderer({
    canvas,
    width,
    height,
  });
  return {
    renderer,
    camera,
    canvas,
    setSize({ width: w, height: h }) {
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      canvas.width = w;
      canvas.height = h;
    },
  };
}

export default function createWebGLRendererPool({
  width,
  height,
}) {
  const factory = {
    create() {
      return createThreeWebGLResources({ width, height });
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
    min: 2,
    max: 32,
  };
  return genericPool.createPool(factory, opts);
}
