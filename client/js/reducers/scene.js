import createReducer from './createReducer';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_CREATE_3D,
  SCENE_DISPLAY_PANORAMA,
  SCENE_DISPLAY_TRANSITION,
  PANO_TEXTURES_LOAD_SUCCESS,
  PANO_TEXTURES_LOAD_FAILURE,
} from '../actions/types';

const reducer = createReducer({
  canvas: null,
  previous: null,
  current: null,
  loaded: null,
  next: null,
  cache: {},
}, {
  [SCENE_LOAD_START](scene, { payload: id, meta: fetchPromise }) {
    return {
      ...scene,
      next: id,
    };
  },
  [SCENE_LOAD_COMPLETE](scene, { payload: data }) {
    const { cache } = scene;
    const { sceneId: id } = data;
    return {
      ...scene,
      loaded: id,
      cache: {
        ...cache,
        [id]: data,
      },
    };
  },
  [SCENE_DISPLAY_PANORAMA](scene, { payload: sceneData }) {
    return {
      ...scene,
    };
  },
  [SCENE_DISPLAY_TRANSITION](scene, { payload: sceneData }) {
    return {
      ...scene,
      next: null,
    };
  },
  [PANO_TEXTURES_LOAD_SUCCESS](scene) {
    const { loaded } = scene;
    return {
      ...scene,
      current: loaded,
      next: null,
    }
  }
});

export default reducer;
