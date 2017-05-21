import {
  each,
  difference,
} from 'lodash';
import {
  actions as specialActions,
} from 'morpheus/special';
import {
  actions as gameActions,
} from 'morpheus/game';
import store from 'store';
import loggerFactory from 'utils/logger';

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
  handleMouseEvent,
} = specialActions;

const logger = loggerFactory('flatspot');

const ORIGINAL_HEIGHT = 480;
const ORIGINAL_WIDTH = 640;
const ORIGINAL_ASPECT_RATIO = ORIGINAL_WIDTH / ORIGINAL_HEIGHT;

export default function (dispatch) {
  const clickStartPos = { left: 0, top: 0 };
  let wasActiveHotspots = [];
  let possibleValidClick = false;
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;
  let width;
  let height;
  let clipWidth;
  let clipHeight;
  let widthScaler;
  let heightScaler;
  const clip = {
    horizontal: 100,
    vertical: 100,
  };

  function handleHotspotDispatches({
    type,
    top,
    left,
    hotspots,
  }) {
    hotspots.some(hotspot => {
      dispatch(handleMouseEvent({
        type,
        top,
        left,
        hotspot,
      }));
      return hotspot.defaultPass;
    });
  }

  function updateState({ top, left }) {
    const { hotspots } = store.getState().special;
    const nowActiveHotspots = [];
    const { dimensions } = store.getState();
    const { width: newWidth, height: newHeight } = dimensions;
    if (width !== newWidth || height !== newHeight) {
      width = newWidth;
      height = newHeight;
      const onScreenAspectRatio = newWidth / newHeight;
      if (onScreenAspectRatio > ORIGINAL_ASPECT_RATIO) {
        const adjustedHeight = width / ORIGINAL_ASPECT_RATIO;
        clipHeight = adjustedHeight - height;
        clipWidth = 0;
        widthScaler = width / ORIGINAL_WIDTH;
        heightScaler = adjustedHeight / ORIGINAL_HEIGHT;
      } else {
        const adjustedWidth = height * ORIGINAL_ASPECT_RATIO;
        clipWidth = adjustedWidth - width;
        clipHeight = 0;
        widthScaler = adjustedWidth / ORIGINAL_WIDTH;
        heightScaler = height / ORIGINAL_HEIGHT;
      }
    }

    const adjustedClickPos = {
      top: (top / heightScaler) + (clipHeight / 2),
      left: (left / widthScaler) + (clipWidth / 2),
    };

    logger.info('Handling mouse event', JSON.stringify({
      wasMouseUpped,
      wasMouseMoved,
      wasMouseDowned,
      adjustedClickPos,
      originalClickPos: {
        top,
        left,
      },
    }, null, 2));

    each(hotspots, (hotspot, index) => {
      const {
        rectTop,
        rectBottom,
        rectLeft,
        rectRight,
      } = hotspot;
      if (adjustedClickPos.top > rectTop
        && adjustedClickPos.top < rectBottom
        && adjustedClickPos.left > rectLeft
        && adjustedClickPos.left < rectRight) {
        nowActiveHotspots.push(hotspot);
      }
    });
    // Update our state

    // Events for hotspots we have left
    handleHotspotDispatches({
      type: 'MouseLeave',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: difference(wasActiveHotspots, nowActiveHotspots),
    });

    // Events for hotspots we have entered
    handleHotspotDispatches({
      type: 'MouseEnter',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: difference(nowActiveHotspots, wasActiveHotspots),
    });

    // User initiated event inside a hotspot so could be valid
    if (wasMouseDowned && nowActiveHotspots.length) {
      handleHotspotDispatches({
        type: 'MouseDown',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots,
      });
    }

    // We were a possible valid click, but user left the hotspot so invalidate
    if (wasMouseMoved) {
      handleHotspotDispatches({
        type: 'MouseMove',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots
      });
    }

    // User pressed and released mouse button inside a valid hotspot
    // TODO: debounce??
    if (wasMouseUpped && nowActiveHotspots.length) {
      handleHotspotDispatches({
        type: 'MouseUp',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots,
      });
      handleHotspotDispatches({
        type: 'MouseClick',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots,
      });
    }

    handleHotspotDispatches({
      type: 'MouseNone',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: difference(hotspots, nowActiveHotspots),
    });

    wasActiveHotspots = nowActiveHotspots;
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
