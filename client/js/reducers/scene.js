import createReducer from './createReducer';
import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_CREATE_3D,
  SCENE_ROTATION,
  SCENE_SET_SENSITIVITY,
  SCENE_SCENE_CREATE,
  SCENE_CAMERA_CREATE,
  SCENE_RENDERER_CREATE,
  SCENE_CAMERA_TRANSLATE,
} from '../actions/types';

const reducer = createReducer({
  canvas: null,
  current: 1050,
  loading: {},
  loaded: {},
  data: null,
  sensitivity: 100,
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
  [SCENE_SET_SENSITIVITY](scene, { payload: sensitivity }) {
    return {
      ...scene,
      sense
    };
  },
  [SCENE_SCENE_CREATE](scene, { payload: scene3D }) {
    return {
      ...scene,
      scene3D,
    };
  },
  [SCENE_CAMERA_CREATE](scene, { payload: camera }) {
    return {
      ...scene,
      camera,
    };
  },
  [SCENE_CAMERA_TRANSLATE](scene, { payload: vector3 }) {
    const { cameraPosition } = scene;
    return {
      ...scene,
      cameraPosition: {
        ...cameraPosition,
        vector3,
      },
    };
  },
  [SCENE_RENDERER_CREATE](scene, { payload: renderer }) {
    return {
      ...scene,
      renderer,
    };
  },
});

export default reducer;
