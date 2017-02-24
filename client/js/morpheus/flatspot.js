import {
  each,
} from 'lodash';
import {
  addMouseUp,
  addMouseMove,
  addMouseDown,
  addTouchStart,
  addTouchMove,
  addTouchEnd,
  addTouchCancel,
} from '../actions/ui';
import {
  setHoverIndex,
  activateHotspotIndex,
} from '../actions/hotspots';
import store from '../store';

const ORIGINAL_HEIGHT = 480;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

export default function (dispatch, hotspots) {
  const clickStartPos = { left: 0, top: 0 };
  let possibleValidClick = false;
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;
  let width;
  let height;
  const clip = {
    horizontal: 100,
    vertical: 100,
  };

  function updateState({ top, left }) {
    // Check if we hit a hotspot
    let hotspotIndex = null;

    const { dimensions } = store.getState();
    const { width: newWidth, height: newHeight } = dimensions;
    if (width != newWidth || height != newHeight) {
      const onScreenAspectRatio = width / height;
      if (onScreenAspectRatio > ORIGINAL_ASPECT_RATIO) {
        clip.horizontal = 0;
        clip.vertical = newHeight * (onScreenAspectRatio - ORIGINAL_ASPECT_RATIO);
      } else if (onScreenAspectRatio <= ORIGINAL_ASPECT_RATIO) {
        clip.vertical = 0;
        clip.horizontal = newWidth * (onScreenAspectRatio - ORIGINAL_ASPECT_RATIO);
      }
      width = newWidth;
      height = newHeight;
    }

    const adjustedClickPos = {
      top: ORIGINAL_HEIGHT * (top + clip.veritcal / 2) / (height + clip.veritcal),
      left: ORIGINAL_WIDTH * (left + clip.horizontal / 2) / (width + clip.horizontal),
    }

    each(hotspots, (hotspot, index) => {
      const {
        rectTop,
        rectBottom,
        rectLeft,
        rectRight,
      } = hotspot;
      if (top > rectTop
        && top < rectBottom
        && left > rectLeft
        && left < rectRight) {
          hotspotIndex = index;
          dispatch(setHoverIndex(hotspotIndex));
          return false;
        }
    });
    // Update our state

    // User initiated event inside a hotspot so could be valid
    if (!possibleValidClick && wasMouseDowned && (hotspotIndex !== null)) {
      possibleValidClick = true;
      clickStartPos.left = left;
      clickStartPos.top = top;
    }

    // We were a possible valid click, but user left the hotspot so invalidate
    if (wasMouseMoved && possibleValidClick && hotspotIndex === null) {
      possibleValidClick = false;
    }

    // User pressed and released mouse button inside a valid hotspot
    // TODO: debounce??
    if (wasMouseUpped && possibleValidClick && hotspotIndex !== null) {
      const interactionDistance = Math.sqrt(
        Math.pow(clickStartPos.left - left, 2)
         + Math.pow(clickStartPos.top - top, 2)
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
  }

  function onMouseDown({ clientX: left, clientY: top }) {
    wasMouseDowned = true;
    updateState({ top, left })
  }

  function onMouseMove({ clientX: left, clientY: top }) {
    wasMouseMoved = true;
    updateState({ top, left })
  }

  function onMouseUp({ clientX: left, clientY: top }) {
    wasMouseUpped = true;
    updateState({ top, left })
  }

  function onTouchStart({ touches }) {
    if (touches.length) {
      const { clientX: left, clientY: top } = touches[0];
      wasMouseDowned = true;
      updateState({ top, left });
    }
  }

  function onTouchMove({ touches }) {
    if (touches.length) {
      const { clientX: left, clientY: top } = touches[0];
      wasMouseMoved = true;
      updateState({ top, left });
    }
  }

  function onTouchEnd({ touches }) {
    if (touches.length) {
      const { clientX: left, clientY: top } = touches[0];
      wasMouseUpped = true;
      updateState({ top, left });
    }
  }

  function onTouchCancel(touchEvent) {
    // TODO....
  }

  dispatch(addMouseUp(onMouseUp));
  dispatch(addMouseMove(onMouseMove));
  dispatch(addMouseDown(onMouseDown));
  dispatch(addTouchStart(onTouchStart));
  dispatch(addTouchMove(onTouchMove));
  dispatch(addTouchEnd(onTouchEnd));
  dispatch(addTouchCancel(onTouchCancel));
}
