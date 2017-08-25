import { createSelector } from 'reselect';

export const input = state => state.input;

export const enabled = createSelector(
  input,
  i => i.enabled,
);
export const disabled = createSelector(
  input,
  i => !i.enabled,
);
export const onMouseUp = createSelector(
  input,
  _input => _input.onMouseUp,
);
export const onMouseMove = createSelector(
  input,
  _input => _input.onMouseMove,
);
export const onMouseDown = createSelector(
  input,
  _input => _input.onMouseDown,
);
export const onTouchStart = createSelector(
  input,
  _input => _input.onTouchStart,
);
export const onTouchMove = createSelector(
  input,
  _input => _input.onTouchMove,
);
export const onTouchEnd = createSelector(
  input,
  _input => _input.onTouchEnd,
);
export const onTouchCancel = createSelector(
  input,
  _input => _input.onTouchCancel,
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
