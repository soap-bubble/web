import {
  each,
} from 'lodash';
import {
  actions as gameActions,
} from 'morpheus/game';
import {
  actions as hotspotActions,
} from 'morpheus/hotspots';
import store from 'store';
import renderEvents from 'utils/render';

const {
  addMouseUp,
  addMouseMove,
  addMouseDown,
  addTouchStart,
  addTouchMove,
  addTouchEnd,
  addTouchCancel,
} = gameActions;
const {
  setHoverIndex,
  activateHotspotIndex,
} = hotspotActions;

export default function ({
  dispatch,
  canvas,
}) {
  const pixel = new Uint8Array(4);
  const clickStartPos = { left: 0, top: 0 };
  let possibleValidClick = false;
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;

  // In order to maintain a high performance webgl context, we want to allow
  //  WebGl to be able to clear it's draw buffer at any time, which means
  //  reading pixel data is only valid immediately after a render.  We therefor
  //  delay checking pixel data until the next render
  let coordsToCheck;
  renderEvents.removeAllListeners('after');
  renderEvents.on('after', () => {
    if (coordsToCheck) {
      const { left: x, top } = coordsToCheck;
      const { hotspots } = store.getState();
      const { hitColorList } = hotspots;
      const gl = canvas.getContext('webgl');
      // readPixels reads from lower left so need to inverse top (y) coordinate
      const y = canvas.height - top;

      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

      let hotspotIndex = null;
      each(hitColorList, (color, index) => {
        // Extract 8-bit color components from 24-bit integer
        const red = color >>> 16;
        const green = color >>> 8 & 0xFF;
        const blue = color & 0xFF;
        // Compare with pixel array
        if (
          red === pixel[0]
          && green === pixel[1]
          && blue === pixel[2]
        ) {
          hotspotIndex = index;
          return false;
        }
      });
      dispatch(setHoverIndex(hotspotIndex));

      // Update our state

      // User initiated event inside a hotspot so could be valid
      if (!possibleValidClick && wasMouseDowned && (hotspotIndex !== null)) {
        possibleValidClick = true;
        clickStartPos.left = coordsToCheck.left;
        clickStartPos.top = coordsToCheck.top;
      }

      // We were a possible valid click, but user left the hotspot so invalidate
      if (wasMouseMoved && possibleValidClick && hotspotIndex === null) {
        possibleValidClick = false;
      }

      // User pressed and released mouse button inside a valid hotspot
      // TODO: debounce??
      if (wasMouseUpped && possibleValidClick && hotspotIndex !== null) {
        const interactionDistance = Math.sqrt(
          Math.pow(clickStartPos.left - coordsToCheck.left, 2)
           + Math.pow(clickStartPos.top - coordsToCheck.top, 2)
        );
        // Only allow taps, not drag-n-release
        if (interactionDistance < 20) {
          dispatch(activateHotspotIndex(hotspotIndex));
        }
      }

      // Reset for next time
      possibleValidClick = !wasMouseUpped && possibleValidClick;
      wasMouseMoved = false;
      wasMouseUpped = false;
      wasMouseDowned = false;
      coordsToCheck = null;
    }
  });

  function rememberEvent(mouseEvent) {
    // Grab these right away because of react event object pooling
    //  See https://fb.me/react-event-pooling
    const { clientX: left, clientY: top } = mouseEvent;
    coordsToCheck = { left, top };
  }

  function onTouchStart(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      wasMouseDowned = true;
      rememberEvent(touches[0]);
    }
  }

  function onTouchMove(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      wasMouseMoved = true;
      rememberEvent(touches[0]);
    }
  }

  function onTouchEnd(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      wasMouseUpped = true;
      rememberEvent(touches[0]);
    }
  }

  function onTouchCancel(touchEvent) {

  }

  function onMouseUp(mouseEvent) {
    wasMouseUpped = true;
    rememberEvent(mouseEvent);
  }

  function onMouseMove(mouseEvent) {
    wasMouseMoved = true;
    rememberEvent(mouseEvent);
  }

  function onMouseDown(mouseEvent) {
    wasMouseDowned = true;
    rememberEvent(mouseEvent);
  }

  dispatch(addMouseUp(onMouseUp));
  dispatch(addMouseMove(onMouseMove));
  dispatch(addMouseDown(onMouseDown));
  dispatch(addTouchStart(onTouchStart));
  dispatch(addTouchMove(onTouchMove));
  dispatch(addTouchEnd(onTouchEnd));
  dispatch(addTouchCancel(onTouchCancel));
}
