
export const touchMouseInterface = [
  'onMouseUp',
  'onMouseMove',
  'onMouseDown',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
];

export const composeMouseTouch = (...delegate) => touchMouseInterface.reduce((tmi, method) => {
  tmi[method] = function composeMouseTouchDelegate(event) {
    delegate.forEach(d => d[method](event));
  };
  return tmi;
}, {});

export const touchDisablesMouse = (delegate) => {
  let isTouch = false;
  return {
    onMouseUp(event) {
      if (!isTouch) {
        delegate.onMouseUp(event);
      }
    },
    onMouseMove(event) {
      if (!isTouch) {
        delegate.onMouseMove(event);
      }
    },
    onMouseDown(event) {
      if (!isTouch) {
        delegate.onMouseDown(event);
      }
    },
    onTouchStart(event) {
      isTouch = true;
      delegate.onTouchStart(event);
    },
    onTouchMove(event) {
      isTouch = true;
      delegate.onTouchMove(event);
    },
    onTouchEnd(event) {
      isTouch = true;
      delegate.onTouchEnd(event);
    },
    onTouchCancel(event) {
      delegate.onTouchCancel(event);
    },
  };
};
