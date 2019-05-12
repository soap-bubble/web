import { createSelector } from 'reselect';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

export const root = state => state.title;

export const titleDimensions = createSelector(
  state => gameSelectors.dimensions(state),
  ({ width, height }) => ({
    width,
    height,
  }),
);

export const titleStyle = createSelector(
  state => gameSelectors.location(state),
  state => gameSelectors.dimensions(state),
  ({ x, y }, { width, height }) => ({
    width,
    height,
    left: x,
    top: y,
  }),
);

export const renderElements = createSelector(
  root,
  ({ canvas, camera, renderer }) => ({
    canvas,
    camera,
    renderer,
    dimensionSelector: titleDimensions,
  }),
);

export const isLeaving = createSelector(
  root,
  ({ leaving }) => leaving,
);

export const isDone = createSelector(
  root,
  ({ done }) => done,
);
