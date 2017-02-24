import {
  SPECIAL_START,
  SPECIAL_END,
} from '../actions/types';
import createReducer from './createReducer';

const reducer = createReducer({
  data: {},
  hotspotData: [],
  url: '',
}, {
  [SPECIAL_START](special, { payload: sceneData, meta }) {
    const {
      url,
      hotspotData,
    } = meta;
    return {
      ...special,
      data: sceneData,
      hotspotData,
      url
    };
  },
  [SPECIAL_END](special) {
    return {
      ...special,
      data: {},
      hotspotData: [],
      url: '',
    };
  },
});

export default reducer;
