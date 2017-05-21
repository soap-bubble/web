import { createSelector } from 'reselect';

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
