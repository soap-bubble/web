import {
  rotateBy,
} from '../actions/pano';
import store from '../store';

export default function (dispatch) {
  // Here an interaction is a user touch gesture or a pointer movement with mouse clicked
  const interaction = {
    // If we are in a user interaction
    active: false,
    // The timestamp of the start of the last user interaction with scene
    startTime: -1,
    // The previous move event position
    lastPos: {},
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

    dispatch(rotateBy(momentum.speed));
  }

  return {
    onMouseDown(mouseEvent) {
      const { clientX: left, clientY: top } = mouseEvent;
      interaction.startTime = Date.now();
      interaction.startPos = { top, left };
      interaction.lastPos = { top, left };
      interaction.active = true;
      clearInterval(interaction.intervalId);
    },
    onMouseMove(mouseEvent) {
      if (interaction.active) {
        const { clientX: left, clientY: top } = mouseEvent;
        const { pano } = store.getState();
        const {
          controlType,
          sensitivity,
        } = pano;
        const speed = {
          horizontal: left - interaction.lastPos.left,
          vertical: top - interaction.lastPos.top,
        };
        const delta = {
          horizontal: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
          vertical: convertFromVerticalSpeed(speed.vertical, sensitivity),
        };
        interaction.lastPos = { top, left };

        dispatch(rotateBy({
          x: delta.vertical,
          y: delta.horizontal,
        }));
      }
    },
    onMouseUp(mouseEvent) {
      const { clientX: left, clientY: top } = mouseEvent;
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
        const elaspedInteractionTime = Date.now() - interaction.startTime;
        const averageSpeed = {
          y: elaspedInteractionTime ? (left - interaction.startPos.left) / elaspedInteractionTime : 0,
          x: elaspedInteractionTime ? (top - interaction.startPos.top) / elaspedInteractionTime : 0
        };
        averageSpeed.x *= 100;
        averageSpeed.y *= 100;
        momentum.speed = {
          x: convertFromHorizontalSpeed(averageSpeed.x, sensitivity),
          y: convertFromVerticalSpeed(averageSpeed.y, sensitivity),
        };
        clearInterval(momentum.intervalId);
        momentum.intervalId = setInterval(updateMomentum, 50);
      }
      interaction.active = false;
    }
  };
}
