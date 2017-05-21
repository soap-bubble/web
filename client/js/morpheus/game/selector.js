import { createSelector } from 'reselect';

export const game = state => state.game;
export const width = createSelector(
  game,
  _game => _game.width,
);
export const height = createSelector(
  game,
  _game => _game.height,
);
