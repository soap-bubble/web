import { createSelector } from 'reselect';

export const game = state => state.game;
export const cursor = createSelector(
  game,
  _game => _game.cursor,
);
export const volume = createSelector(
  game,
  _game => _game.volume,
);
export const width = createSelector(
  game,
  _game => _game.width,
);
export const height = createSelector(
  game,
  _game => _game.height,
);
