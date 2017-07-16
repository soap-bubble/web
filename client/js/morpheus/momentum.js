import { last } from 'lodash';
import {
  actions as castActions,
  selectors as castSelectors,
} from 'morpheus/casts';
import {
  selectors as gameSelectors,
} from 'morpheus/game';
import raf from 'raf';
import store from 'store';
import input from 'morpheus/input';

const {
  addMouseUp,
  addMouseMove,
  addMouseDown,
  addTouchStart,
  addTouchMove,
  addTouchEnd,
  addTouchCancel,
} = input.actions;

export default function ({ dispatch, scene }) {
  // Here an interaction is a user touch gesture or a pointer movement with mouse clicked
  const interaction = {
    // If we are in a user interaction
    active: false,
    // The timestamp of the start of the last user interaction with scene
    startTime: -1,
    // All positions for this interaction event
    positions: [],
    // The start of an interaction position
    startPos: {},
  };

  // Momentum is a sense of continued be deaccelerating user interaction that continues after the user event ends
  const momentum = {
    enabled: false,
    abort: false,
    speed: { x: 0, y: 0}
  };

  const SWING_DELTA = 0.25;
  const DEG_TO_RAD = Math.PI / 180;
  const MAX_MOMENTUM = 0.0125 * DEG_TO_RAD;
  const DAMPER = 0.90;

  function convertFromHorizontalSpeed(delta, sensitivity) {
    const speed =  (delta * DEG_TO_RAD) / (10.0 * ((19 - sensitivity) / 18.0 ));
    return speed;
  }

  function convertFromVerticalSpeed(delta, sensitivity) {
    return (delta * DEG_TO_RAD) / (7.0 * ((19 - sensitivity) / 18.0 ));
  }

  function startMomentum() {
    if (!momentum.enabled) {
      momentum.enabled = true;
      updateMomentum();
    }
  }

  function updateMomentum() {
    if (!momentum.abort) {
      const rotation = castSelectors.pano.rotation(store.getState());
      const sensitivity = gameSelectors.sensitivity(store.getState());
      let yFine = false;

      if (momentum.speed.y > MAX_MOMENTUM || momentum.speed.y < -MAX_MOMENTUM) {
        momentum.speed.y *= DAMPER;
      } else {
        momentum.speed.y = 0;
        yFine = true;
      }

      if (momentum.speed.x > MAX_MOMENTUM || momentum.speed.x < -MAX_MOMENTUM) {
        momentum.speed.x *= DAMPER;
      } else if (yFine){
        momentum.speed.x = 0;
        momentum.enabled = false;
      }

      dispatch(castActions.pano.rotateBy(momentum.speed));
    }
    momentum.abort = false;
    if (momentum.enabled) {
      raf(updateMomentum);
    }
  }

  function onInteractionStart({ left, top }) {
    interaction.startTime = Date.now();
    interaction.active = true;
    interaction.positions = [{ top, left, time: interaction.startTime }];
    interaction.startPos = interaction.positions[0];
    momentum.abort = true;
  }

  function onInteractionMove({ left, top }) {
    if (interaction.active) {
      const controlType = gameSelectors.controlType(store.getState());
      const sensitivity = gameSelectors.sensitivity(store.getState());
      const interactionLastPos = last(interaction.positions);
      const speed = {
        horizontal: left - interactionLastPos.left,
        vertical: top - interactionLastPos.top,
      };
      const delta = {
        horizontal: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
        vertical: convertFromVerticalSpeed(speed.vertical, sensitivity),
      };
      const time = Date.now();
      if (!interaction.positions.length || last(interaction.positions).time !== time) {
        interaction.positions.push({ time: Date.now(), left, top, ...delta });
      }
      if (interaction.positions.length > 5) {
        interaction.positions.shift();
      }

      dispatch(castActions.pano.rotateBy({
        x: delta.vertical,
        y: delta.horizontal,
      }));
    }
  }

  function onInteractionEnd({ left, top }) {
    const sensitivity = gameSelectors.sensitivity(store.getState());
    const interactionDebounce = gameSelectors.interactionDebounce(store.getState());
    let interactionMomemtum = { x: 0, y: 0 };
    const interactionDistance = Math.sqrt(
      Math.pow(interaction.startPos.left - left, 2)
       + Math.pow(interaction.startPos.top - top, 2)
    );
    if (interactionDistance > interactionDebounce) {
      const lastPosition = last(interaction.positions);
      momentum.speed.x = lastPosition.vertical;
      momentum.speed.y = lastPosition.horizontal;
      startMomentum();
    }
    interaction.active = false;
  }

  function onTouchStart(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      const { clientX: left, clientY: top } = touches[0];
      onInteractionStart({ top, left });
    }
  }

  function onTouchMove(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      const { clientX: left, clientY: top } = touches[0];
      onInteractionMove({ top, left });
    }
  }

  function onTouchEnd(touchEvent) {
    const { touches } = touchEvent;
    if (touches.length) {
      const { clientX: left, clientY: top } = touches[0];
      onInteractionEnd({ top, left });
    }
  }

  function onTouchCancel(touchEvent) {

  }

  function onMouseDown(mouseEvent) {
    const { clientX: left, clientY: top } = mouseEvent;
    onInteractionStart({ left, top });
  }

  function onMouseMove(mouseEvent) {
    const { clientX: left, clientY: top } = mouseEvent;
    onInteractionMove({ left, top });
  }


  function onMouseUp(mouseEvent) {
    const { clientX: left, clientY: top } = mouseEvent;
    onInteractionEnd({ left, top });
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
