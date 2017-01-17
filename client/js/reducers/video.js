import createReducer from './createReducer';
import {
  VIDEO_LOAD_START,
  VIDEO_IS_PLAYING,
  VIDEO_LOAD_COMPLETE,
  VIDEO_PLAY_DONE,
  PANO_TEXTURES_LOAD_SUCCESS,
} from '../actions/types';

export default createReducer({

}, {
  [VIDEO_LOAD_START](video, { payload: name }) {
    return {
      ...video,
      [name]: { state: 'loading' },
    };
  },
  [VIDEO_LOAD_COMPLETE](video, { payload: name, meta: videoEl }) {
    const { [name]: thisVideo } = video;
    return {
      ...video,
      [name]: {
        ...thisVideo,
        state: 'loaded',
        el: videoEl,
      },
    };
  },
  [VIDEO_IS_PLAYING](video, { payload: name, meta: videoEl }) {
    const { [name]: thisVideo } = video;
    return {
      ...video,
      [name]: {
        ...thisVideo,
        state: 'playing',
        el: videoEl,
      },
    };
  },
  [VIDEO_PLAY_DONE](video, { payload: name }) {
    const { [name]: thisVideo } = video;
    return {
      ...video,
      [name]: {
        ...thisVideo,
        state: 'done',
      },
    };
  },
  [PANO_TEXTURES_LOAD_SUCCESS]() {
    return {};
  },
});
