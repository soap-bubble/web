import {
  concat,
  without
 } from 'lodash';

import createReducer from './createReducer';
import {
  SCENE_CANVAS_CREATED,
  SCENE_LOAD_START,
  SCENE_LOAD_COMPLETE
} from '../actions/types';

const intialScene = {
  canvas: null,
  current: 1050,
  loading: {},
  loaded: {}
}
const reducer = createReducer({
  canvas: null
}, {
  [SCENE_CANVAS_CREATED](scene = {}, { payload: canvas }) {
    return (
      ...state,
      { canvas }
    );
  },
  [SCENE_LOAD_START](scene, { meta }) {
    const { id } = meta;
    const { loading } = scene;

    loading[id] = { meta };

    return {
      ...scene,
      loading
    };
  },
  [SCENE_LOAD_COMPLETE](scene, data) {
    const { sceneId: id } = scene;
    let { loading, loaded } = scene;

    loading[id] = null;
    loaded[id] = id;
    
    return {
      ...scene,
      loading,
      loaded
    };
  }
})

export default reducer;
