import {
  GAME_SCENE_LOADING,
  PANOANIM_VIDEO_LOAD,
  PANOANIM_OBJECT_CREATE,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  panoCastsData: [],
  object3D: null,
}, {
  [GAME_SCENE_LOADING](panoAnim, { payload: sceneData }) {
    const { casts } = sceneData;
    const panoAnimCasts = casts
      .filter(c => c.__t === 'PanoAnim');

    return {
      ...panoAnim,
      casts: panoAnimCasts,
      isPanoAnim: !!panoAnimCasts.length,
    };
  },
  [PANOANIM_OBJECT_CREATE](panoAnim, { payload: object3D }) {
    return {
      ...panoAnim,
      object3D,
    };
  },
});

export default reducer;
