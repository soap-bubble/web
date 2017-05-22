import { createSelector } from 'reselect';

export const panoAnim = state => state.panoAnim;
export const isPanoAnim = createSelector(
  panoAnim,
  pa => pa.isPanoAnim,
);
