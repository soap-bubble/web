import {
  each,
  difference,
} from 'lodash';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as inputSelectors,
} from 'morpheus/input';
import {
  actions as gameActions,
  selectors as gameSelectors,
} from 'morpheus/game';
import {
  isActive,
  selectors as gamestateSelectors,
} from 'morpheus/gamestate';
import storeFactory from 'store';
import loggerFactory from 'utils/logger';
import {
  screenToGame,
} from 'utils/coordinates';

const logger = loggerFactory('flatspot');

export default function ({ dispatch, scene }) {
  const store = storeFactory();
  const castSelectorForScene = castSelectors.forScene(scene);
  const castActionsForScene = castActions.forScene(scene);

  let wasActiveHotspots = [];
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;
  let mouseDown = false;
  let lastMouseDown;

  function handleHotspotDispatches({
    type,
    top,
    left,
    hotspots,
  }) {
    hotspots.some((hotspot) => {
      const handled = dispatch(castActionsForScene.special.handleMouseEvent({
        type,
        top,
        left,
        hotspot,
      }));
      return handled;
    });
  }

  function updateState({ clientX, clientY }) {
    const state = store.getState();
    const inputEnabled = inputSelectors.enabled(state);
    if (!inputEnabled) {
      return;
    }
    const location = gameSelectors.location(state);
    const hotspots = castSelectorForScene.special.hotspotData(state);
    const isCurrent = sceneSelectors.currentSceneData(state) === scene;
    const isExiting = castSelectorForScene.isExiting(state);
    const acceptsMouseEvents = isCurrent && !isExiting;
    if (!acceptsMouseEvents) {
      return;
    }
    const nowActiveHotspots = [];
    const left = clientX - location.x;
    const top = clientY - location.y;

    const newWidth = gameSelectors.width(store.getState());
    const newHeight = gameSelectors.height(store.getState());

    const adjustedClickPos = screenToGame({
      height: newHeight,
      width: newWidth,
      top,
      left,
    });

    each(hotspots, (hotspot) => {
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

    const leavingHotspots = difference(wasActiveHotspots, nowActiveHotspots);
    const enteringHotspot = difference(nowActiveHotspots, wasActiveHotspots);
    const noInteractionHotspots = difference(hotspots, nowActiveHotspots);
    const isClick = Date.now() - lastMouseDown < 800;

    logger.info({
      nowActiveHotspots,
      leavingHotspots,
      enteringHotspot,
      isClick,
      wasMouseMoved,
      wasMouseDowned,
      wasMouseUpped,
    });
    handleHotspotDispatches({
      type: 'Always',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: hotspots
        .filter(h => h.castId === 0),
    });
    // User pressed and released mouse button inside a valid hotspot
    // TODO: debounce??
    if (wasMouseUpped && nowActiveHotspots.length) {
      mouseDown = false;
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
      type: 'MouseOver',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: nowActiveHotspots,
    });

    handleHotspotDispatches({
      type: 'MouseLeave',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: leavingHotspots,
    });

    // Events for hotspots we have entered
    handleHotspotDispatches({
      type: 'MouseEnter',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: enteringHotspot,
    });

    // User initiated event inside a hotspot so could be valid
    if (!mouseDown && wasMouseDowned && nowActiveHotspots.length) {
      mouseDown = true;
      lastMouseDown = Date.now();
      handleHotspotDispatches({
        type: 'MouseDown',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots,
      });
    }

    if (wasMouseMoved) {
      handleHotspotDispatches({
        type: 'MouseMove',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots,
      });
    }

    if (wasMouseMoved && mouseDown) {
      handleHotspotDispatches({
        type: 'MouseStillDown',
        top: adjustedClickPos.top,
        left: adjustedClickPos.left,
        hotspots: nowActiveHotspots,
      });
    }

    handleHotspotDispatches({
      type: 'MouseNone',
      top: adjustedClickPos.top,
      left: adjustedClickPos.left,
      hotspots: noInteractionHotspots,
    });

    nowActiveHotspots.every((hotspot) => {
      // Some special cases
      const gamestates = gamestateSelectors.forState(store.getState());
      if (isActive({ cast: hotspot, gamestates })) {
        const {
          type,
          cursorShapeWhenActive,
        } = hotspot;
        if (wasMouseUpped && type >= 5 && type <= 8) {
          dispatch(gameActions.setOpenHandCursor());
          return false;
        } else if (wasMouseDowned || wasMouseMoved) {
          if (type >= 5 && type <= 8) {
            const currentCursor = gameSelectors.morpheusCursor(store.getState());
            if (currentCursor !== 10009) {
              dispatch(gameActions.setOpenHandCursor());
            }
            return false;
          } else if (cursorShapeWhenActive) {
            dispatch(gameActions.setCursor(cursorShapeWhenActive));
            return false;
          }
        }
      }
      return true;
    });
    wasActiveHotspots = nowActiveHotspots;
    wasMouseMoved = false;
    wasMouseUpped = false;
    wasMouseDowned = false;

    // Update cursor location and icon
    dispatch(gameActions.setCursorLocation({ top, left }));
    // Update scene
    dispatch(castActionsForScene.special.update(scene));
  }

  function onMouseDown(mouseEvent) {
    wasMouseDowned = true;
    updateState(mouseEvent);
  }

  function onMouseMove(mouseEvent) {
    wasMouseMoved = true;
    updateState(mouseEvent);
  }

  function onMouseUp(mouseEvent) {
    wasMouseUpped = true;
    updateState(mouseEvent);
  }

  function onTouchStart({ touches }) {
    if (touches.length) {
      wasMouseDowned = true;
      updateState(touches[0]);
    }
  }

  function onTouchMove({ touches }) {
    if (touches.length) {
      wasMouseMoved = true;
      updateState(touches[0]);
    }
  }

  function onTouchEnd({ touches }) {
    if (touches.length) {
      wasMouseUpped = true;
      updateState(touches[0]);
    }
  }

  function onTouchCancel(/* touchEvent */) {
    // TODO....
  }

  return {
    onMouseUp,
    onMouseMove,
    onMouseDown,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
}
