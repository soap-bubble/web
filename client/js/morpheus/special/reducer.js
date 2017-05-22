import createReducer from 'utils/createReducer';
import {
  SPECIAL_CONTROLLED_FRAMES,
  SPECIAL_IMAGES_LOADED,
  SCENE_LOAD_COMPLETE,
  SPECIAL_START,
  SPECIAL_END,
  SPECIAL_HOTSPOTS_LIST,
  SPECIAL_CANVAS,
} from './actionTypes';

const reducer = createReducer('special', {
  data: {},
  hotspots: [],
  images: {},
  url: '',
  canvas: null,
  controlledFrames: {},
}, {
  [SPECIAL_HOTSPOTS_LIST](special, { payload: hotspots }) {
    return {
      ...special,
      hotspots,
    };
  },
  [SPECIAL_IMAGES_LOADED](special, { payload: images }) {
    return {
      ...special,
      images: images.reduce((memo, curr) => {
        memo[curr.castId] = curr.img;
        return memo;
      }, {}),
    };
  },
  [SPECIAL_CONTROLLED_FRAMES](special, { payload: controlledFrames }) {
    return {
      ...special,
      controlledFrames,
    };
  },
  [SCENE_LOAD_COMPLETE](special, { payload: sceneData }) {
    const { casts } = sceneData;
    const hotspotsData = casts.filter(c => c.castId === 0);
    return {
      ...special,
      data: sceneData,
      hotspots: hotspotsData,
    };
  },
  [SPECIAL_START](special, { meta }) {
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
    };
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
