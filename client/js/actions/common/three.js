import {
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';
import {
  pull
} from 'lodash';
import raf from 'raf';

export function createCameraForType({ type, width, height }) {
  return {
    type,
    payload: new PerspectiveCamera(55, width / height, 0.01, 1000),
  };
}

export function positionCameraForType({ camera, type, vector3}) {
  ['x', 'y', 'z'].forEach(axis => {
    if (vector3[axis]) {
      camera.position[axis] = vector3[axis];
    }
  });
  return {
    type,
    payload: vector3,
  };
}

export function createRendererForType({ type, canvas, width, height }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  return {
    type,
    payload: renderer,
  };
}

export const addToRenderLoop = (function createRendererIFEE() {
  const renderCallbackList = [];
  const isStarted = false;

  function render() {
    raf(render);
    renderCallbackList.forEach(r => r());
  }

  function start() {
    if (!isStarted) {
      raf(render);
    }
  }

  return (callback) => {
    renderCallbackList.push(callback);
    start();
    return () => {
      pull(renderCallbackList, callback);
    };
  }
}());
