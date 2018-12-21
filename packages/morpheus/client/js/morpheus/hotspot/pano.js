import {
  Raycaster,
} from 'three';
import {
  difference,
  sortBy,
  uniq,
  get,
} from 'lodash';
import {
  selectors as castSelectors,
  actions as castActions,
} from 'morpheus/casts';
import {
  selectors as sceneSelectors,
} from 'morpheus/scene';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import Queue from 'promise-queue';
import {
  actions as inputActions,
  handleEventFactory,
} from 'morpheus/input';
import createOrientation from 'morpheus/input/orientation';
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';
import storeFactory from 'store';
import {
  isHotspot,
} from 'morpheus/casts/matchers';

const actionQueue = new Queue(1, 128);

export default function ({
  dispatch,
  scene,
}) {
  const store = storeFactory();
  const handleEvent = handleEventFactory();
  const raycaster = new Raycaster();
  const hotspots = scene.casts.filter(isHotspot);
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
  let lastUpdatePostion;

  function updateGame({ clientX, clientY }, isTouch, isTouchEnd) {
    const location = gameSelectors.location(store.getState());
    const currentSreenPosition = isTouchEnd ? lastTouchPosition : {
      top: clientY - location.y,
      left: clientX - location.x,
    };

    const state = store.getState();
    const currentScene = sceneSelectors.currentSceneData(state);
    if (currentScene === scene && !document.hidden) {
      const cache = castSelectors.forScene(scene).cache();
      const { camera, canvas } = cache.hotspot.webgl;
      const hotspotScene3D = cache.hotspot.scene3D;
      const panoScene3D = cache.pano.scene3D;

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
      const hotspotObject3Ds = get(panoScene3D, 'children[0].children', []);
      const panoIntersects = raycaster.intersectObjects(hotspotObject3Ds.filter(c => c.name === 'pano'), true);
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

      let interactionDistance;

      if (wasMouseUpped && startingScreenPosition) {
        interactionDistance = Math.sqrt(
          ((currentSreenPosition.left - startingScreenPosition.left) ** 2)
          + ((currentSreenPosition.top - startingScreenPosition.top) ** 2),
        );
      } else if (wasMouseUpped) { // if no previous mouse down
        startingScreenPosition = currentSreenPosition;
        interactionDistance = 0;
      }

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
        await dispatch(inputActions.cursorSetPosition(currentSreenPosition));
        // Update the PanoAnim
        await dispatch(castActionsForScene.update(eventOptions));
      });
    }
  }

  const orientation = createOrientation((rotation) => {
    dispatch(castActionsForScene.pano.rotateBy({
      x: rotation.y,
      y: rotation.x,
    }));
    if (lastUpdatePostion) {
      updateGame(lastUpdatePostion);
    }
  });

  function update(event, isTouch, isTouchEnd) {
    const { clientX, clientY } = event;
    lastUpdatePostion = { clientX, clientY };
    updateGame({ clientX, clientY }, isTouch, isTouchEnd);
  }

  function off() {
    if (orientation) {
      orientation.off();
    }
  }

  function rememberEvent(mouseEvent, isTouch) {
    update(mouseEvent, isTouch);
  }

  function onTouchStart(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      wasMouseDowned = true;
      rememberEvent(touches[0], true);
    }
  }

  function onTouchMove(touchEvent) {
    const { touches } = touchEvent;
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
    off,
    handlers: {
      onMouseUp,
      onMouseMove,
      onMouseDown,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: () => {},
    },
  };
}
