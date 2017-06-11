import {
  VIDEO_LOAD_START,
  VIDEO_LOAD_COMPLETE,
  VIDEO_IS_PLAYING,
  VIDEO_PLAY_DONE,
} from './actionTypes';


export function load(videoEl) {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      function videoCanPlayThrough() {
        resolve(videoEl);
      }

      function videoError(err) {
        reject(err);
      }

      videoEl.addEventListener('canplaythrough', videoCanPlayThrough);
      videoEl.addEventListener('error', videoError);
    });
  };
}

/* The functions below are deprecated for external users.  Use `load` above */
export function videoLoadComplete(name, video) {
  return {
    type: VIDEO_LOAD_COMPLETE,
    payload: name,
    meta: video,
  };
}

export function videoLoad(name, cast, videoEl) {
  return {
    type: VIDEO_LOAD_START,
    payload: name,
    meta: { cast, el: videoEl },
  };
}

export function videoIsPlaying(name) {
  return {
    type: VIDEO_IS_PLAYING,
    payload: name,
  };
}

export function videoPlayDone(name) {
  return {
    type: VIDEO_PLAY_DONE,
    payload: name,
  };
}
