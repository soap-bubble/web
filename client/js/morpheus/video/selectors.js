import {
  get,
} from 'lodash';
import { createSelector } from 'reselect';
import {
  getPanoAnimUrl,
} from 'service/gamedb';

export const video = state => state.video;

function pullAllVideosOfType(type) {
  return createSelector(
    video,
    _v => Object
      .keys(_v)
      .filter(v => v.state === type)
      .map(k => _v[k]),
  );
}
export const loading = pullAllVideosOfType('loading');
export const loaded = pullAllVideosOfType('loaded');
export const playing = pullAllVideosOfType('playing');
export const done = pullAllVideosOfType('done');

export function forCast(castData) {
  if (castData.__t === 'PanoCast') {
    const name = getPanoAnimUrl(castData.fileName);
    const videoEl = state => get(state, `${name}.el`);
    return {
      videoEl,
    };
  }
  throw new Error(`Not able to return a selector for ${castData.__t}`);
}
