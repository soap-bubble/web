import { createSelector } from 'reselect';

export const transition = state => state.transition;
export const data = createSelector(
  transition,
  t => t.data,
);
export const isTransitionLoading = createSelector(
  data,
  d => !!d,
);
