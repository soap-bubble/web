import { createSelector } from 'reselect';

export const special = state => state.special;
export const url = createSelector(
  special,
  s => s.url,
);
export const canvas = createSelector(
  special,
  s => s.canvas,
);
