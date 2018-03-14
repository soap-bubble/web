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
  handleEventFactory,
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
import Queue from 'promise-queue';
import storeFactory from 'store';
import loggerFactory from 'utils/logger';
import {
  screenToGame,
} from 'utils/coordinates';

const logger = loggerFactory('flatspot');
const queue = new Queue(1, 12);

export default function ({ dispatch, scene }) {
  const store = storeFactory();
  const castSelectorForScene = castSelectors.forScene(scene);
  const castActionsForScene = castActions.forScene(scene);
  const handleEvent = handleEventFactory();

  let wasActiveHotspots = [];
  let wasMouseDownedInHotspots = [];
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;
  let mouseDown = false;
  let lastMouseDown;

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

    const gamestates = gamestateSelectors.forState(state);
    const enabledHotspots = hotspots
      .filter(cast => isActive({ cast, gamestates }));
    each(enabledHotspots, (hotspot) => {
      const {
        rectTop,
        rectBottom,
        rectLeft,
        rectRight,
      } = hotspot;
      if ((adjustedClickPos.top > rectTop
        && adjustedClickPos.top < rectBottom
        && adjustedClickPos.left > rectLeft
        && adjustedClickPos.left < rectRight)
      || (rectTop === 0
        && rectLeft === 0
        && rectRight === 0
        && rectBottom === 0
      )) {
        nowActiveHotspots.push(hotspot);
      }
    });

    const leavingHotspots = difference(wasActiveHotspots, nowActiveHotspots);
    const enteringHotspots = difference(nowActiveHotspots, wasActiveHotspots);
    const noInteractionHotspots = difference(enabledHotspots, nowActiveHotspots);
    const isClick = Date.now() - lastMouseDown < 800;

    if (wasMouseUpped) {
      mouseDown = false;
    }

    if (!mouseDown && wasMouseDowned) {
      mouseDown = true;
      wasMouseDownedInHotspots = nowActiveHotspots;
      lastMouseDown = Date.now();
    }
    const isMouseDown = mouseDown;

    queue.add(() => dispatch(handleEvent({
      top,
      left,
      enabledHotspots,
      nowActiveHotspots,
      leavingHotspots,
      enteringHotspots,
      noInteractionHotspots,
      wasMouseDownedInHotspots,
      isClick,
      isMouseDown,
      wasMouseMoved,
      wasMouseUpped,
      wasMouseDowned,
    })), 'handle event');

    wasActiveHotspots = nowActiveHotspots;
    wasMouseMoved = false;
    wasMouseUpped = false;
    wasMouseDowned = false;

    // Update cursor location and icon
    queue.add(() => dispatch(gameActions.setCursorLocation({ top, left })), 'cursor location');
    // dispatch(gameActions.setCursorLocation({ top, left }));
    // Update scene
    queue.add(() => dispatch(castActionsForScene.special.update(scene)), 'update scene');
    // dispatch(castActionsForScene.special.update(scene));
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
