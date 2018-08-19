import {
  Raycaster,
} from 'three';
import {
  difference,
  sortBy,
  uniq,
} from 'lodash';
import {
  selectors as castSelectors,
  actions as castActions,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  actions as gameActions,
  selectors as gameSelectors,
} from 'morpheus/game';
import Queue from 'promise-queue';
import {
  handleEventFactory,
} from 'morpheus/input';
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';
import storeFactory from 'store';

const actionQueue = new Queue(1, 128);

export default function ({
  dispatch,
  scene,
}) {
  const store = storeFactory();
  const handleEvent = handleEventFactory();
  const raycaster = new Raycaster();
  const hotspots = castSelectors.forScene(scene).hotspot.hotspotsData(store.getState());
  const castActionsForScene = castActions.forScene(scene);
  let startingPanoPosition;
  let startingScreenPosition;
  let wasInHotspots = [];
  let lastMouseDown;
  let mouseDown = false;
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;
  let lastTouchPosition;

  function update({ clientX, clientY }, isTouch, isTouchEnd) {
    const location = gameSelectors.location(store.getState());

    const currentSreenPosition = isTouchEnd ? lastTouchPosition : {
      top: clientY - location.y,
      left: clientX - location.x,
    };
    // if (mouseEventQueue.getPendingLength()) {
    //   dispatch(gameActions.setCursorLocation(currentSreenPosition));
    // }
    const state = store.getState();
    const currentScene = sceneSelectors.currentSceneData(state);
    if (currentScene === scene && !document.hidden) {
      const canvas = castSelectors.forScene(scene).hotspot.canvas(state);
      const hotspotScene3D = castSelectors.forScene(scene).hotspot.scene3D(state);
      const panoScene3D = castSelectors.forScene(scene).pano.panoScene3D(state);
      const camera = castSelectors.forScene(scene).hotspot.camera(state);

      // Convert mouse coordinates to x, y clamped between -1 and 1.  Also invert y
      const y = (((canvas.height - currentSreenPosition.top) / canvas.height) * 2) - 1;
      const x = (((currentSreenPosition.left - canvas.width) / canvas.width) * 2) + 1;
      // Create a ray that travels from camera through screen at mouse location
      raycaster.setFromCamera({ x, y }, camera);
      // Got all faces that the ray intersects
      const hotspotIntersects = raycaster.intersectObjects(hotspotScene3D.children, true);
      // Map faces to hotspots...
      const nowInHotspots = sortBy( // Sorted by cast index
        uniq( // In the off chance that we hit both faces in a hotspot
          hotspotIntersects.map(i => Math.floor(i.faceIndex / 2)),
        ),
      ) // Map back to hotspot index
        .map(hotspotIndex => hotspots[hotspotIndex]);

      const panoIntersects = raycaster.intersectObjects(panoScene3D.children[0].children.filter(c => c.name === 'pano'), true);
      const currentPanoPosition = {};
      const panoIntersect = panoIntersects.find((intersect) => {
        if (intersect && intersect.uv) {
          return true;
        }
        return false;
      });
      if (panoIntersect) {
        const { uv, object: { material } } = panoIntersect;
        material.map.transformUv(uv);
        let left = uv.x * 2400;
        let top = (uv.y * 1000) - 250;
        if (uv.y > 0.5) {
          left += 2400;
          top = ((uv.y - 0.5) * 1000) - 250;
        }
        left -= 375;
        if (left < 0) {
          left += 3600;
        }
        currentPanoPosition.left = left;
        currentPanoPosition.top = top;
      }

      const leavingHotspots = difference(wasInHotspots, nowInHotspots);
      const enteringHotspots = difference(nowInHotspots, wasInHotspots);
      const noInteractionHotspots = difference(hotspots, nowInHotspots);

      // Update our state
      if (wasMouseUpped) {
        mouseDown = false;
      }

      if (!mouseDown && wasMouseDowned) {
        mouseDown = true;
        startingPanoPosition = currentPanoPosition;
        startingScreenPosition = currentSreenPosition;
        lastMouseDown = Date.now();
      }
      const isMouseDown = mouseDown;

      const interactionDistance = wasMouseUpped && Math.sqrt(
        ((currentSreenPosition.left - startingScreenPosition.left) ** 2)
        + ((currentSreenPosition.top - startingScreenPosition.top) ** 2),
      );
      const debounceDistance = isTouch ? 80 : 20;
      const isClick = wasMouseUpped
        && (Date.now() - lastMouseDown < 500) && interactionDistance < debounceDistance;

      const eventOptions = {
        currentPosition: currentPanoPosition,
        startingPosition: startingPanoPosition,
        hotspots,
        nowInHotspots,
        leavingHotspots,
        enteringHotspots,
        noInteractionHotspots,
        isClick,
        isMouseDown,
        wasMouseMoved,
        wasMouseUpped,
        wasMouseDowned,
        handleHotspot: gamestateActions.handlePanoHotspot,
      };

      wasInHotspots = nowInHotspots;
      wasMouseMoved = false;
      wasMouseUpped = false;
      wasMouseDowned = false;

      if (isTouch) {
        lastTouchPosition = currentSreenPosition;
      }

      actionQueue.add(async () => {
        // Update gamestate
        await dispatch(handleEvent(eventOptions));
        // Update cursor location and icon
        await dispatch(gameActions.setCursorLocation(currentSreenPosition));
        // Update the PanoAnim
        await dispatch(castActionsForScene.update(eventOptions));
      });
    }
  }

  function rememberEvent(mouseEvent, isTouch) {
    update(mouseEvent, isTouch);
  }

  function onTouchStart(touchEvent) {
    const { touches } = touchEvent;
    touchEvent.preventDefault();
    touchEvent.stopPropagation();
    if (touches.length) {
      wasMouseDowned = true;
      rememberEvent(touches[0], true);
    }
  }

  function onTouchMove(touchEvent) {
    const { touches } = touchEvent;
    touchEvent.preventDefault();
    touchEvent.stopPropagation();
    if (touches.length) {
      wasMouseMoved = true;
      rememberEvent(touches[0], true);
    }
  }

  function onTouchEnd(touchEvent) {
    const { changedTouches: touches } = touchEvent;
    if (touches.length) {
      wasMouseUpped = true;
      rememberEvent(touches[0], true);
    }
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

  return {
    onMouseUp,
    onMouseMove,
    onMouseDown,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: () => {},
  };
}
