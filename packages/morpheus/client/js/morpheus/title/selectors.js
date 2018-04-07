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
  titleDimensions,
  ({ x, y }, { width, height }) => ({
    width: `${width}px`,
    height: `${height}px`,
    left: `${x}px`,
    top: `${y}px`,
  }),
);

export const renderElements = createSelector(
  root,
  ({ camera, renderer }) => ({
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
