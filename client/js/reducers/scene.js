import createReducer from './createReducer';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_DISPLAY_PANORAMA,
  SCENE_DISPLAY_TRANSITION,
  PANO_TEXTURES_LOAD_SUCCESS,
  VIDEO_IS_PLAYING,
//  PANO_TEXTURES_LOAD_FAILURE,
} from '../actions/types';

function sceneEnd(scene) {
  const { loaded } = scene;
  return {
    ...scene,
    current: loaded,
    next: null,
  };
}

const reducer = createReducer({
  canvas: null,
  previous: null,
  current: null,
  loaded: null,
  next: null,
  cache: {},
}, {
  [SCENE_LOAD_START](scene, { payload: id }) {
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
  [SCENE_DISPLAY_PANORAMA](scene) {
    return {
      ...scene,
    };
  },
  [SCENE_DISPLAY_TRANSITION](scene) {
    return {
      ...scene,
      next: null,
    };
  },
  [PANO_TEXTURES_LOAD_SUCCESS]: sceneEnd,
  [VIDEO_IS_PLAYING]: sceneEnd,
});

export default reducer;
