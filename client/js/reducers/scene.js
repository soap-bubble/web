import createReducer from './createReducer';
import {
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_CREATE_3D,
  SCENE_DISPLAY_PANORAMA,
  SCENE_DISPLAY_TRANSITION,
} from '../actions/types';

const reducer = createReducer({
  canvas: null,
  current: 1050,
  loading: {},
  loaded: {},
  data: null,
}, {
  [SCENE_LOAD_START](scene, { payload: id, meta: fetchPromise }) {
    const { loading } = scene;
    return {
      ...scene,
      loading: {
        ...loading,
        [id]: fetchPromise,
      },
    };
  },
  [SCENE_LOAD_COMPLETE](scene, { payload: data }) {
    const { loading, loaded } = scene;
    const { sceneId: id } = data;
    return {
      ...scene,
      current: id,
      loading: {
        ...loading,
        [id]: null,
      },
      loaded: {
        ...loaded,
        [id]: data,
      },
      data,
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
    };
  },
});

export default reducer;
