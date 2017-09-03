import {
  Raycaster,
} from 'three';
import {
  uniq,
  sortBy,
} from 'lodash';
import {
  selectors as castSelectors,
  actions as castActions,
} from 'morpheus/casts';
import {
  actions as gameActions,
} from 'morpheus/game';
import store from 'store';

export default function ({
  dispatch,
  scene,
}) {
  const raycaster = new Raycaster();
  const clickStartPos = { left: 0, top: 0 };
  const hotspotsData = castSelectors.forScene(scene).hotspot.hotspotsData(store.getState());
  let possibleValidClick = false;
  let wasMouseDowned = false;
  let wasMouseMoved = false;
  let wasMouseUpped = false;

  function update({ left, top }) {
    if (!document.hidden) {
      const canvas = castSelectors.forScene(scene).hotspot.canvas(store.getState());
      const scene3D = castSelectors.forScene(scene).hotspot.scene3D(store.getState());
      const camera = castSelectors.forScene(scene).hotspot.camera(store.getState());
      // Convert mouse coordinates to x, y clamped between -1 and 1.  Also invert y
      const y = (((canvas.height - top) / canvas.height) * 2) - 1;
      const x = (((left - canvas.width) / canvas.width) * 2) + 1;
      // Create a ray that travels from camera through screen at mouse location
      raycaster.setFromCamera({ x, y }, camera);
      // Got all faces that the ray intersects
      const intersects = raycaster.intersectObjects(scene3D.children, true);
      // Map faces to hotspots...
      const hoveredHotspots = sortBy( // Sorted by cast index
        uniq( // In the off chance that we hit both faces in a hotspot
          intersects.map(i => Math.floor(i.faceIndex / 2)),
        ),
      ) // Map back to hotspot index
        .map(hotspotIndex => hotspotsData[hotspotIndex]);

      const hovering = !!hoveredHotspots.length;

      // Update our state

      // User initiated event inside a hotspot so could be valid
      if (!possibleValidClick && wasMouseDowned && hovering) {
        possibleValidClick = true;
        clickStartPos.left = left;
        clickStartPos.top = top;
      }

      // We were a possible valid click, but user left the hotspot so invalidate
      if (wasMouseMoved && possibleValidClick && !hovering) {
        possibleValidClick = false;
      }

      // User pressed and released mouse button inside a valid hotspot
      // TODO: debounce??
      const interactionDistance = Math.sqrt(
        ((clickStartPos.left - left) ** 2) + ((clickStartPos.top - top) ** 2),
      );
      if (wasMouseUpped && possibleValidClick && hovering && interactionDistance < 20) {
        dispatch(castActions.forScene(scene).hotspot.activated(hoveredHotspots));
      } else {
        dispatch(castActions.forScene(scene).hotspot.hovered(hoveredHotspots));
      }

      // Reset for next time
      possibleValidClick = !wasMouseUpped && possibleValidClick;
      wasMouseMoved = false;
      wasMouseUpped = false;
      wasMouseDowned = false;
    }
  }

  function rememberEvent(mouseEvent) {
    // Grab these right away because of react event object pooling
    //  See https://fb.me/react-event-pooling
    const { clientX: left, clientY: top } = mouseEvent;
    update({ left, top });
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

  function onTouchCancel() {

  }

  function onMouseUp(mouseEvent) {
    wasMouseUpped = true;
    rememberEvent(mouseEvent);
  }

  function onMouseMove(mouseEvent) {
    const { clientX: left, clientY: top } = mouseEvent;
    wasMouseMoved = true;
    dispatch(gameActions.setCursorLocation({ top, left }));
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
    onTouchCancel,
  };
}
