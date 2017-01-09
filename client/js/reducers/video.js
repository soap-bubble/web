import createReducer from './createReducer';
import {
  VIDEO_LOAD_START,
  VIDEO_LOAD_COMPLETE,
  VIDEO_PLAY_DONE,
} from '../actions/types';

export default createReducer({
  loading: {},
  loaded: {},
  done: {},
}, {
  [VIDEO_LOAD_START](video, { payload: name }) {
    const { loading } = video;
    return {
      ...video,
      loading: {
        ...loading,
        [name]: true,
      },
    };
  },
  [VIDEO_LOAD_COMPLETE](video, { payload: name, meta: videoEl }) {
    const { loading, loaded } = video;
    return {
      ...video,
      loading: {
        ...loading,
        [name]: null,
      },
      loaded: {
        ...loaded,
        [name]: videoEl,
      },
    };
  },
  [VIDEO_PLAY_DONE](video, { payload: name }) {
    const { loaded, done } = video;
    return {
      ...video,
      loaded: {
        ...loaded,
        [name]: null,
      },
      done: {
        ...done,
        [name]: loaded[name],
      },
    };
  },
});
