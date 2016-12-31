import createReducer from './createReducer';
import {
  VIDEO_LOAD_START,
  VIDEO_LOAD_COMPLETE,
} from '../actions/types';

export default createReducer({
  loading: {},
  loaded: {},
}, {
  [VIDEO_LOAD_START](video, { payload: name, meta: promise }) {
    const { loading } = video;
    return {
      ...video,
      loading: {
        ...loading,
        [name]: promise,
      },
    };
  },
  [VIDEO_LOAD_COMPLETE](video, { payload: name }) {
    const { loading, loaded } = video;
    return {
      ...video,
      loading: {
        ...loading,
        [name]: null,
      },
      loaded: {
        ...loaded,
        [name]: loading[name],
      },
    };
  },
});
