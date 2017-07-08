import { createSelector } from 'reselect';

const MORPHEUS_TO_HTML_CURSOR = {
  [10001]: 'alias',
  [10002]: 'pointer',
  [10005]: 'alias',
  [10008]: '-webkit-grab',
  [10009]: '-webkit-grabbing'
};

export const game = state => state.game;
export const morpheusCursor = createSelector(
  game,
  _game => _game.cursor,
);
export const htmlCursor = createSelector(
  morpheusCursor,
  _cursor => MORPHEUS_TO_HTML_CURSOR[_cursor] || 'move',
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
export const sensitivity = createSelector(
  game,
  _game => _game.sensitivity,
);
export const controlType = createSelector(
  game,
  _game => _game.controlType,
);
export const interactionDebounce = createSelector(
  game,
  _game => _game.interactionDebounce,
);
export const dimensions = createSelector(
  width,
  height,
  (_width, _height) => ({
    width: _width,
    height: _height,
  }),
);
