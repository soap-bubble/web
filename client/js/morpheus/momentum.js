import { last } from 'lodash';
import {
  actions as panoActions,
} from 'morpheus/pano';
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

export default function (dispatch) {
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
    intervalId: 0,
    speed: { x: 0, y: 0}
  };

  const SWING_DELTA = 0.25;
  const DEG_TO_RAD = Math.PI / 180;
  const MAX_MOMENTUM = 0.5 * DEG_TO_RAD;

  function convertFromHorizontalSpeed(delta, sensitivity) {
    const speed =  (delta * DEG_TO_RAD) / (10.0 * ((19 - sensitivity) / 18.0 ));
    return speed;
  }

  function convertFromVerticalSpeed(delta, sensitivity) {
    return (delta * DEG_TO_RAD) / (7.0 * ((19 - sensitivity) / 18.0 ));
  }

  function updateMomentum() {
    const { pano } = store.getState();
    const {
      sensitivity,
      rotation,
    } = pano;
    let yFine = false;

    if (momentum.speed.y > MAX_MOMENTUM) {
      momentum.speed.y -= MAX_MOMENTUM;
    } else if (momentum.speed.y < -MAX_MOMENTUM) {
      momentum.speed.y += MAX_MOMENTUM;
    } else {
      momentum.speed.y = 0;
      yFine = true;
    }

    if (momentum.speed.x > MAX_MOMENTUM ) {
      momentum.speed.x -= MAX_MOMENTUM;
    } else if (momentum.speed.x < -MAX_MOMENTUM) {
      momentum.speed.x += MAX_MOMENTUM;
    } else if (yFine){
      momentum.speed.x = 0;
      clearInterval(momentum.intervalId);
    }

    dispatch(panoActions.rotateBy(momentum.speed));
  }

  function onInteractionStart({ left, top }) {
    interaction.startTime = Date.now();
    interaction.active = true;
    interaction.positions = [{ top, left, time: interaction.startTime }];
    interaction.startPos = interaction.positions[0];
    clearInterval(interaction.intervalId);
  }

  function onInteractionMove({ left, top }) {
    if (interaction.active) {
      const { pano } = store.getState();
      const {
        controlType,
        sensitivity,
      } = pano;
      const interactionLastPos = last(interaction.positions);
      const speed = {
        horizontal: left - interactionLastPos.left,
        vertical: top - interactionLastPos.top,
      };
      const delta = {
        horizontal: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
        vertical: convertFromVerticalSpeed(speed.vertical, sensitivity),
      };
      interaction.positions.push({ top, left, time: Date.now() });
      if (interaction.positions.length > 5) {
        interaction.positions.shift();
      }

      dispatch(panoActions.rotateBy({
        x: delta.vertical,
        y: delta.horizontal,
      }));
    }
  }

  function onInteractionEnd({ left, top }) {
    const {
      interactionDebounce,
      sensitivity,
    } = store.getState().pano;
    let interactionMomemtum = { x: 0, y: 0 };
    const interactionDistance = Math.sqrt(
      Math.pow(interaction.startPos.left - left, 2)
       + Math.pow(interaction.startPos.top - top, 2)
    );
    if (interactionDistance > interactionDebounce) {
      const averageSpeed = interaction.positions.reduce((memo, speed, index) => {
        if (index === 0) {
          return memo;
        }
        const previous = interaction.positions[index - 1];
        const deltaTime = speed.time - previous.time;
        const deltaX = speed.left - previous.left;
        const deltaY = speed.top - previous.top;
        const speedX = deltaX / deltaTime;
        const speedY = deltaY / deltaTime;
        return {
          left: (memo.left + speedX) / 2,
          top: (memo.top + speedY) / 2,
        };
      }, {
        top: 0,
        left: 0,
      });
      averageSpeed.left *= 20;
      averageSpeed.top *= 10;
      momentum.speed = {
        x: convertFromHorizontalSpeed(averageSpeed.top, sensitivity),
        y: convertFromVerticalSpeed(averageSpeed.left, sensitivity),
      };
      clearInterval(momentum.intervalId);
      momentum.intervalId = setInterval(updateMomentum, 50);
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

  dispatch(addMouseUp(onMouseUp));
  dispatch(addMouseMove(onMouseMove));
  dispatch(addMouseDown(onMouseDown));
  dispatch(addTouchStart(onTouchStart));
  dispatch(addTouchMove(onTouchMove));
  dispatch(addTouchEnd(onTouchEnd));
  dispatch(addTouchCancel(onTouchCancel));
}
