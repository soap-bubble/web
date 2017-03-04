import {
  SCENE_LOAD_COMPLETE,
  SPECIAL_START,
  SPECIAL_END,
  SPECIAL_HOTSPOTS_COLORLIST,
  SPECIAL_CANVAS,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  data: {},
  hotspots: [],
  url: '',
  canvas: null,
  hitColorList: [],
}, {
  [SPECIAL_HOTSPOTS_COLORLIST](special, { payload: hitColorList }) {
    return {
      ...special,
      hitColorList,
    }
  },
  [SCENE_LOAD_COMPLETE](special, { payload: sceneData }) {
    const { casts } = sceneData;
    const hotspotsData = casts.filter(c => c.castId === 0);
    return {
      ...special,
      hotspots: hotspotsData,
    };
  },
  [SPECIAL_START](special, { payload: sceneData, meta }) {
    const {
      url,
    } = meta;
    return {
      ...special,
      url,
    };
  },
  [SPECIAL_CANVAS](special, { payload: canvas }) {
    return {
      ...special,
      canvas,
    }
  },
  [SPECIAL_END](special) {
    return {
      ...special,
      data: {},
      hotspots: [],
      url: '',
      canvas: null,
      hitColorList: [],
    };
  },
});

export default reducer;
