import raf from 'raf';
import { bySceneId } from '../service/scene';
import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_ROTATION,
  SCENE_SET_SENSITIVITY,
} from './types';
import { createPano } from './pano';
import { createHotspots } from './hotspots';
import {
  createScene,
  createCamera,
  createRenderer,
} from './three';

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

export function startRenderLoop() {
  return (dispatch, getState) => {
    const { hotspots, pano, three } = getState();
    const { scene, camera, renderer } = three;
    function render() {
      raf(render);
      // hotspots.object3D.rotation.y += 0.01;
      // pano.object3D.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    raf(render);
  }
}


export function rotateBy({ x: deltaX, y: deltaY }) {
  const UP_DOWN_LIMIT = 8.5;
  return (dispatch, getState) => {
    let {
      x,
      y,
    } = getState().scene.rotation;

    x += deltaX;
    if (x > UP_DOWN_LIMIT) {
      x = UP_DOWN_LIMIT;
    }
    if (x < -UP_DOWN_LIMIT) {
      x = -UP_DOWN_LIMIT;
    }
    y += deltaY;
    if (y >= 360) {
      y -= 360;
    } else if (y < 0) {
      y += 360
    }
    dispatch(rotate({ x, y }));
  }

}

export function rotate({ x, y }) {
  return (dispatch, getState) => {
    const { hotspots, pano } = getState();

    const radRot = {
      x: (Math.PI * x) / 180,
      y: (Math.PI * y) / 180,
    };

    Object.assign(hotspots.object3D.rotation, radRot);
    Object.assign(pano.object3D.rotation, radRot);

    dispatch({
      type: SCENE_ROTATION,
      payload: { x, y },
    });
  }
}

export function setSensitivity(sensitivity) {
  return {
    type: SCENE_SET_SENSITIVITY,
    payload: sensitivity,
  };
}
