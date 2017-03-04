import { connect } from 'react-redux';
import React from 'react';
import {
  each,
} from 'lodash';

import flatspot from '../morpheus/flatspot';
import store from '../store';
import {
  setHoverIndex,
  activateHotspotIndex,
} from '../actions/hotspots';
import {
  specialImgIsLoaded,
  specialHitCanvaseCreated,
  generateHitCanvas,
} from '../actions/special';

const ORIGINAL_HEIGHT = 480;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

function mapStateToProps({ special, dimensions }) {
  const {
    url: backgroundUrl,
    canvas,
  } = special;
  const {
    width,
    height,
  } = dimensions;

  return {
    backgroundUrl,
    width,
    height,
    canvas,
  }
}

function mapDispatchToProps(dispatch) {
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
    const { hotspots } = store.getState().special;
    // Check if we hit a hotspot
    let hotspotIndex = null;

    const { dimensions } = store.getState();
    const { width: newWidth, height: newHeight } = dimensions;
    if (width != newWidth || height != newHeight) {
      const onScreenAspectRatio = newWidth / newHeight;
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
      top: ORIGINAL_HEIGHT * (top + clip.vertical / 2) / (height + clip.vertical),
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

  let canvas;
  function onWindowResize() {
    if (canvas) {
      dispatch(generateHitCanvas(canvas));
    }
  }

  return {
    onImgIsLoaded(imgEl) {
      dispatch(specialImgIsLoaded());
      onWindowResize();
    },
    onCanvasCreate(_canvas) {
      if (_canvas) {
        window.addEventListener('resize', onWindowResize);
      } else {
        window.removeEventListener('resize', onWindowResize);
      }
      canvas = _canvas;
      dispatch(specialHitCanvaseCreated(canvas));
      dispatch(generateHitCanvas(canvas));
    },
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  }
}

const Special = connect(
  mapStateToProps,
  mapDispatchToProps,
)(({
  onCanvasCreate,
  onMouseUp,
  onMouseMove,
  onMouseDown,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onTouchCancel,
  backgroundUrl,
  onImgIsLoaded,
  width,
  height,
}) => (
  <div
    onMouseUp={onMouseUp}
    onMouseMove={onMouseMove}
    onMouseDown={onMouseDown}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    onTouchCancel={onTouchCancel}
  >
    <img
      style={{
        objectFit: 'cover',
        position: 'absolute',
      }}
      onLoad={onImgIsLoaded}
      src={backgroundUrl}
      width={width}
      height={height}
    />
    <canvas
      ref={onCanvasCreate}
      width={width}
      height={height}
    />
  </div>
));

export default Special;
