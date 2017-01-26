import createReducer from './createReducer';
import {
  SCENE_LOAD_COMPLETE,
} from '../actions/types';

const reducer = createReducer({
  cache: {},
}, {
  [SCENE_LOAD_COMPLETE](cast, { payload: sceneData }) {
    const { cache } = cast;
    return {
      ...cast,
      cache: sceneData.casts.reduce((acc, cast) => {
        if (cast.fileName) {
          acc[cast.fileName] = cast;
        }
        return acc;
      }, { ...cache }),
    };
  },
})
