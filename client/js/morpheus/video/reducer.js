import createReducer from 'utils/createReducer';
import {
  VIDEO_LOAD_START,
  VIDEO_IS_PLAYING,
  VIDEO_LOAD_COMPLETE,
  VIDEO_PLAY_DONE,
  PANO_RENDER_LOOP,
  TRANSITION_START,
} from './actionTypes';

export default createReducer('video', {}, {
  [VIDEO_LOAD_START](video, { payload: name, meta: { cast, el } }) {
    const { __t: type, looping } = cast;

    return {
      ...video,
      [name]: { state: 'loading', type, looping, el, url: name },
    };
  },
  [VIDEO_LOAD_COMPLETE](video, { payload: name, meta: videoEl }) {
    const { [name]: thisVideo } = video;
    return {
      ...video,
      [name]: {
        ...thisVideo,
        state: 'loaded',
        el: videoEl || thisVideo.el,
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
        el: videoEl || thisVideo.el,
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
  [PANO_RENDER_LOOP](video) {
    return Object.keys(video).reduce((acc, name) => {
      const vid = video[name];
      if (vid.type === 'MovieSpecialCast') {
        delete acc[name];
      }
      return acc;
    }, { ...video });
  },
  [TRANSITION_START](video) {
    return Object.keys(video).reduce((acc, name) => {
      const vid = video[name];
      if (vid.type === 'PanoAnim') {
        delete acc[name];
      }
      return acc;
    }, { ...video });
  },
});
