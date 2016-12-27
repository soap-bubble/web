import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
} from 'three';
import raf from 'raf';
import { bySceneId } from '../service/scene';
import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_SCENE_CREATE,
  SCENE_CAMERA_CREATE,
  SCENE_CAMERA_TRANSLATE,
  SCENE_RENDERER_CREATE,
} from './types';
import { createPano } from './pano';
import { createHotspots } from './hotspots';

export function canvasCreated(canvas) {
  return {
    type: SCENE_CANVAS_CREATED,
    payload: canvas,
  };
}

export function sceneLoadComplete(responseData) {
  return {
    type: SCENE_LOAD_COMPLETE,
    payload: responseData,
  };
}

export function sceneLoad(id) {
  return {
    type: SCENE_LOAD_START,
    payload: id,
  };
}

export function fetchScene(id) {
  return (dispatch) => {
    dispatch(sceneLoad(id));
    return bySceneId(id)
      .then(response => response.data)
      .then((sceneData) => {
        dispatch(sceneLoadComplete(sceneData));
        return sceneData;
      });
  };
}

export function buildScene() {
  return (dispatch, getState) => {
    dispatch(createPano());
    dispatch(createHotspots());
    const objects = [];
    objects.push(getState().pano.object3D);
    objects.push(getState().hotspots.object3D);
    dispatch(createScene(objects));
  }
}

export function buildRig() {
  return (dispatch, getState) => {
    const { width, height } = getState().dimensions;
    const { canvas } = getState().scene;
    dispatch(createCamera({ width, height }));
    dispatch(createRenderer({ canvas, width, height }));
  };
}

export function createScene(objects) {
  const scene = new Scene();
  objects.forEach(o => scene.add(o));
  return {
    type: SCENE_SCENE_CREATE,
    payload: scene,
  };
}

export function createCamera({ width, height }) {
  return {
    type: SCENE_CAMERA_CREATE,
    payload: new PerspectiveCamera(55, width / height, 0.01, 1000),
  };
}

export function positionCamera(vector3) {
  return (dispatch, getState) => {
    const { camera } = getState().scene;
    ['x', 'y', 'z'].forEach(axis => {
      if (vector3[axis]) {
        camera.position[axis] = vector3[axis];
      }
    });
    return {
      type: SCENE_CAMERA_TRANSLATE,
      payload: vector3,
    };
  };
}

export function createRenderer({ canvas, width, height }) {
  const renderer = new WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  return {
    type: SCENE_RENDERER_CREATE,
    payload: renderer,
  };
}

export function startRenderLoop() {
  return (dispatch, getState) => {
    const { hotspots, pano, scene } = getState();
    const { scene3D, camera, renderer } = scene;
    function render() {
      raf(render);
      // hotspots.object3D.rotation.y += 0.01;
      // pano.object3D.rotation.y += 0.01;
      renderer.render(scene3D, camera);
    }
    raf(render);
  }
}
