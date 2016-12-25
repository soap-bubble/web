import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';
import store from '../store';
import {
  THREE_SCENE_CREATE,
  THREE_CAMERA_CREATE,
  THREE_CAMERA_TRANSLATE,
  THREE_RENDERER_CREATE,
} from './types';

export function createScene(objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return {
    type: THREE_SCENE_CREATE,
    payload: scene,
  };
}

export function createCamera({ width, height }) {
  return {
    type: THREE_CAMERA_CREATE,
    payload: new PerspectiveCamera(55, width / height, 0.01, 1000),
  };
}

export function positionCamera(vector3) {
  const { camera } = store.getState().three;
  ['x', 'y', 'z'].forEach(axis => {
    if (vector3[axis]) {
      camera.position[axis] = vector3[axis];
    }
  });
  return {
    type: THREE_CAMERA_TRANSLATE,
    payload: vector3,
  };
}

export function createRenderer({ canvas, width, height }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  return {
    type: THREE_RENDERER_CREATE,
    payload: renderer,
  };
}
