import { createSelector } from 'reselect';
import {
  selectors as gameSelectors,
} from 'morpheus/game';

export const root = state => state.title;

export const titleDimensions = createSelector(
  state => gameSelectors.dimensions(state),
  ({ width, height }) => ({
    width,
    height: height * 0.5,
  }),
);

export const titleStyle = createSelector(
  state => gameSelectors.location(state),
  titleDimensions,
  ({ x, y }, { width, height }) => ({
    width: `${width}px`,
    height: `${height}px`,
    left: `${x}px`,
    top: `${y + (height / 8)}px`,
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
