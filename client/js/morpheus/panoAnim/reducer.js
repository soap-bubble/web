import createReducer from 'utils/createReducer';
import {
  GAME_SCENE_LOADING,
  PANOANIM_OBJECT_CREATE,
} from './actionTypes';

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
