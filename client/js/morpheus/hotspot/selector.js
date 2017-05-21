import { createSelector } from 'reselect';

export const hotspot = state => state.hotspot;

export const data = createSelector(
  hotspot,
  _hotspot => _hotspot.data,
);

export const isPano = createSelector(
  hotspot,
  _hotspot => _hotspot.isPano,
);
