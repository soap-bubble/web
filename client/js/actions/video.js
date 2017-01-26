import Promise from 'bluebird'

import {
  VIDEO_LOAD_START,
  VIDEO_LOAD_COMPLETE,
  VIDEO_IS_PLAYING,
  VIDEO_PLAY_DONE,
} from './types';
import {
  resize,
} from './dimensions';

// Map of names to promises
const loading = {};

export function videoLoadComplete(name, video) {
  if (!loading[name]) {
    throw new Error(`No way to complete a video load for ${name} which was never started`);
  }

  if (!loading[name].videoEl) {
    loading[name].videoEl = video;
  }

  return {
    type: VIDEO_LOAD_COMPLETE,
    payload: name,
    meta: video,
  };
}

export function videoLoad(name, type, autoPlay) {
  loading[name] = {
    autoPlay,
  };

  return {
    type: VIDEO_LOAD_START,
    payload: name,
    meta: type,
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
