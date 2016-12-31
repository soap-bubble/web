import {
  VIDEO_LOAD_START,
  VIDEO_LOAD_COMPLETE,
} from './types';

// Map of names to promises
const loading = {};

export function videoLoadComplete(name, video) {
  if (!loading[name]) {
    throw new Error(`No way to complete a video load for ${name} which was never started`);
  }

  loading[name].resolve(video);

  return {
    type: VIDEO_LOAD_COMPLETE,
    payload: name,
  };
}

export function videoLoad(name) {
  if (loading[name]) {
    return;
  }

  loading[name] = Promise.defer()
  return {
    type: VIDEO_LOAD_START,
    payload: name,
    meta: loading[name].promise,
  };
}

export function playFullscreenVideo(name) {
  return (dispatch, getState) => {
    dispatch(videoLoad(name));
    loading[name].promise.then((videoEl) => {
      videoEl.play();
    });
  }
}
