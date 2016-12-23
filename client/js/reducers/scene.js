import renderer from '../three/render';
import createScene from '../three/scene';
import createReducer from './createReducer';
import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE,
  SCENE_CREATE_3D,
} from '../actions/types';

const reducer = createReducer({
  canvas: null,
  current: 1050,
  loading: {},
  loaded: {},
  data: null,
  three: null,
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
});

export default reducer;
