import createReducer from './createReducer';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_DISPLAY_PANORAMA,
  SCENE_DISPLAY_TRANSITION,
  PANO_TEXTURES_LOAD_SUCCESS,
  VIDEO_IS_PLAYING,
  TRANSITION_START,
  TRANSITION_END,
  SPECIAL_IS_LOADED,
//  PANO_TEXTURES_LOAD_FAILURE,
} from '../actions/types';

function sceneEnd(scene) {
  const { loaded, current } = scene;
  return {
    ...scene,
    current: loaded,
    previous: current,
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
  [PANO_TEXTURES_LOAD_SUCCESS](scene) {
    const { cache, current, isTransition, isTransitionEndedWaitingOnTextureLoad } = scene;
    if (isTransitionEndedWaitingOnTextureLoad || !isTransition) {
      return sceneEnd({
        ...scene,
        isTransitionEndedWaitingOnTextureLoad: false,
      });
    }
    const sceneData = cache[current];
    if (sceneData) {
      const { casts } = sceneData;
      const transitionCast = casts.find(c => c.castId === sceneData.sceneId);
      if (transitionCast) {
        return {
          ...scene,
          isWaitingOnTransistion: true,
        };
      }
    }
    return sceneEnd(scene);
  },
  [TRANSITION_START](scene) {
    return {
      ...scene,
      isTransition: true,
    };
  },
  [TRANSITION_END](scene) {
    const { isWaitingOnTransistion } = scene;
    if (isWaitingOnTransistion) {
      return sceneEnd({
        ...scene,
        isWaitingOnTransistion: false,
        isTransition: false,
      });
    }
    return {
      ...scene,
      isTransitionEndedWaitingOnTextureLoad: true,
      isTransition: false,
    };
  },
  [VIDEO_IS_PLAYING]: sceneEnd,
  [SPECIAL_IS_LOADED]: sceneEnd,
});

export default reducer;
