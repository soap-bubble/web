import { createSelector } from 'reselect';

export const game = state => state.game;
export const morpheusCursor = createSelector(
  game,
  _game => _game.cursor,
);
export const cursorImg = createSelector(
  game,
  _game => _game.cursorImg,
);
export const canvas = createSelector(
  game,
  _game => _game.canvas,
);
export const width = createSelector(
  game,
  _game => _game.width,
);
export const height = createSelector(
  game,
  _game => _game.height,
);
export const location = createSelector(
  game,
  _game => _game.location,
);
export const style = createSelector(
  width,
  height,
  location,
  (w, h, l) => ({
    width: `${w}px`,
    height: `${h}px`,
    left: `${l.x}px`,
    top: `${l.y}px`,
  }),
);
export const dimensions = createSelector(
  width,
  height,
  (_width, _height) => ({
    width: _width,
    height: _height,
  }),
);
