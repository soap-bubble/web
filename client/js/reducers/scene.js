import createReducer from './createReducer';
import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_CREATE_3D,
  SCENE_ON_MOUSE_UP,
  SCENE_ON_MOUSE_MOVE,
  SCENE_ON_MOUSE_DOWN,
  SCENE_ROTATION,
  SCENE_UPDATE_MOMENTUM,
  SCENE_UPDATE_MOMENTUM_INTERVAL_ID,
} from '../actions/types';

const SWING_DELTA = 0.25;
const UP_DOWN_LIMIT = 8.5;
const MAX_MOMENTUM = 0.5;

function convertFromHorizontalSpeed(delta, sensitivity) {
  return delta / (10.0 * ((19 - sensitivity) / 18.0 ));
}

function convertFromVerticalSpeed(delta, sensitivity) {
  return delta / (7.0 * ((19 - sensitivity) / 18.0 ));
}

const reducer = createReducer({
  canvas: null,
  current: 1050,
  loading: {},
  loaded: {},
  data: null,
  three: null,
  sensitivity: 50,
  interactionLastPos: {
    top: 0,
    bottom: 0,
  },
  controlType: 'touch',
  rotation: {
    x: 0,
    y: 0,
  },
  interactionDebounce: 5,
}, {
  [SCENE_CANVAS_CREATED](scene, { payload: canvas }) {
    return {
      ...scene,
      canvas,
    };
  },
  [SCENE_LOAD_START](scene, { payload: id }) {
    const { loading } = scene;

    loading[id] = true;

    return {
      ...scene,
      loading,
    };
  },
  [SCENE_LOAD_COMPLETE](scene, { payload: data }) {
    const { loading, loaded } = scene;
    const { sceneId: id } = data;

    loading[id] = null;
    loaded[id] = true;

    return {
      ...scene,
      current: id,
      loading,
      loaded,
      data,
    };
  },
  [SCENE_ROTATION](scene, { payload: rotation }) {
    return {
      ...scene,
      rotation,
    };
  },
  [SCENE_UPDATE_MOMENTUM_INTERVAL_ID](scene, { payload: momentumIntervalId }) {
    return {
      ...scene,
      momentumIntervalId,
    };
  },
  [SCENE_UPDATE_MOMENTUM](scene, payload: interactionMomemtum) {
    return {
      ...scene,
      interactionMomemtum,
    };
  },
  [SCENE_ON_MOUSE_DOWN](scene, { payload }) {
    const { top, left } = payload;

    return {
      ...scene,
      interaction: true,
      interactionStartPos: { top, left },
      interactionLastPos: { top, left },
      interactionSpeed: { horizontal: 0, vertical: 0 },
      interactionTimeStamp: Date.now()
    };
  },
  [SCENE_ON_MOUSE_MOVE](scene, { payload }) {
    const { top, left } = payload;
    const {
      controlType,
      interactionLastPos,
      sensitivity
    } = scene;
    let { rotation } = scene;
    rotation = Object.assign({}, rotation);
    const speed = {
      horizontal: left - interactionLastPos.left,
      vertical: top - interactionLastPos.top,
    };

    const delta = {
      horizontal: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
      vertical: convertFromVerticalSpeed(speed.vertical, sensitivity),
    };

    if (controlType === 'touch') {
      let x = -delta.horizontal;
      let y = -delta.vertical;
      rotation.x += x;
      if (rotation.x > UP_DOWN_LIMIT) {
        rotation.x = UP_DOWN_LIMIT;
      }
      if (rotation.x < -UP_DOWN_LIMIT) {
        rotation.x = -UP_DOWN_LIMIT;
      }
      rotation.y += y;
      if (rotation.y >= 360) {
        rotation.y -= 360;
      } else if (y < 0) {
        y += 360
      }
    }

    return {
      ...scene,
      interaction: true,
      interactionLastPos: { top, left },
      interactionSpeed: { horizontal: 0, vertical: 0 },
      interactionTimeStamp: Date.now(),
      rotation,
    };
  },
  [SCENE_ON_MOUSE_UP](scene, { payload }) {
    const { top, left } = payload;
    const {
      interactionStartPos,
      interactionDebounce,
      interactionTimeStamp,
      sensitivity,
    } = scene;
    let needsMomomentum = false;
    let interactionMomemtum = { x: 0, y: 0 };
    const interactionDistance = Math.sqrt(Math.pow(interactionStartPos.left - left, 2) + Math.pow(interactionStartPos.top - top, 2));
    if (interactionDistance > interactionDebounce) {
      const elaspedInteractionTime = Date.now() - interactionTimeStamp;
      const averageSpeed = {
        x: elaspedInteractionTime ? (left - interactionStartPos.left) / elaspedInteractionTime : 0,
        y: elaspedInteractionTime ? (top - interactionStartPos.top) / elaspedInteractionTime : 0
      };
      interactionMomemtum = {
        x: convertFromHorizontalSpeed(averageSpeed.x, sensitivity),
        y: convertFromVerticalSpeed(averageSpeed.y, sensitivity),
      };
      needsMomomentum = true;
    }
    return {
      ...scene,
      interactionMomemtum,
      interaction: false,
      needsMomomentum,
    };
  },

});

export default reducer;
