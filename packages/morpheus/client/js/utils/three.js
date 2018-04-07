import {
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';

export function createCamera({ width, height, position }) {
  const camera = new PerspectiveCamera(51.75, 640 / 420, 0.01, 1000);
  if (position) {
    ['x', 'y', 'z'].forEach((axis) => {
      if (position[axis]) {
        camera.position[axis] = position[axis];
      }
    });
  }
  return camera;
}

export function createCameraForType({ type, width, height, position }) {
  return {
    type,
    payload: createCamera({ width, height, position }),
  };
}

export function positionCamera({ camera, vector3 }) {
  ['x', 'y', 'z'].forEach((axis) => {
    if (vector3[axis]) {
      camera.position[axis] = vector3[axis];
    }
  });
  return vector3;
}

export function positionCameraForType({ camera, type, vector3 }) {
  return {
    type,
    payload: positionCamera({ camera, vector3 }),
  };
}

export function createRenderer({ canvas, width, height, alpha = true }) {
  const renderer = new WebGLRenderer({ canvas, alpha });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

export function createRendererForType({ type, canvas, width, height }) {
  return {
    type,
    payload: createRenderer({ canvas, width, height }),
  };
}
