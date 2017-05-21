import { createSelector } from 'reselect';

export const game = state => state.game;
export const cursor = createSelector(
  game,
  _game => _game.cursor,
);
export const width = createSelector(
  game,
  _game => _game.width,
);
export const height = createSelector(
  game,
  _game => _game.height,
);
export const onMouseUp = createSelector(
  game,
  _game => _game.onMouseUp,
);
export const onMouseMove = createSelector(
  game,
  _game => _game.onMouseMove,
);
export const onMouseDown = createSelector(
  game,
  _game => _game.onMouseDown,
);
export const onTouchStart = createSelector(
  game,
  _game => _game.onTouchStart,
);
export const onTouchMove = createSelector(
  game,
  _game => _game.onTouchMove,
);
export const onTouchEnd = createSelector(
  game,
  _game => _game.onTouchEnd,
);
export const onTouchCancel = createSelector(
  game,
  _game => _game.onTouchCancel,
);
export const allMouseEvents = createSelector(
  onMouseUp,
  onMouseMove,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  // eslint-disable-next-line no-shadow
  (onMouseUp, onMouseMove, onMouseDown, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel) => ({
    onMouseUp,
    onMouseMove,
    onMouseDown,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  }),
);
