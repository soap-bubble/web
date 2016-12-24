import { connect } from 'react-redux';
import {
  fetchScene,
  canvasCreated,
  onMouseUp,
  onMouseMove,
  onMouseDown,
  updateMomentum,
  updateMomentumInterval,
  rotate,
} from '../../actions/scene';
import { sceneCreate } from '../../actions/three';
import Canvas from '../presentations/Canvas';
import store from '../../store';

function mapStateToProps({ scene, dimensions }) {
  const {
    current: id,
    data,
    interaction,
    interactionMomemtum,
  } = scene || {};
  const { width, height } = dimensions;
  return {
    id,
    data,
    width,
    height,
  };
}

function mapDisptachToProps(dispatch) {
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
  const UP_DOWN_LIMIT = 8.5;
  const MAX_MOMENTUM = 0.5;

  function convertFromHorizontalSpeed(delta, sensitivity) {
    const speed =  delta / (10.0 * ((19 - sensitivity) / 18.0 ));
    console.log(speed);
    return speed;
  }

  function convertFromVerticalSpeed(delta, sensitivity) {
    return delta / (7.0 * ((19 - sensitivity) / 18.0 ));
  }


  function updateMomentum() {
    const { scene } = store.getState();
    const { rotation } = scene;
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

    dispatch(rotate({
      x: rotation.x + momentum.speed.x,
      y: rotation.y + momentum.speed.y,
    }));
  }

  return {
    fetchScene(id) {
      dispatch(fetchScene(id))
        .then(() => {
          dispatch(sceneCreate());
        });
    },
    createAction(canvas) {
      dispatch(canvasCreated(canvas));
    },
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
        const { scene } = store.getState();
        const {
          controlType,
          itermnteractionLastPos,
          sensitivity
        } = scene;
        let {
          x: rotationX,
          y: rotationY,
        } = scene.rotation;
        const speed = {
          horizontal: left - interaction.lastPos.left,
          vertical: top - interaction.lastPos.top,
        };
        const delta = {
          horizontal: convertFromHorizontalSpeed(speed.horizontal, sensitivity),
          vertical: convertFromVerticalSpeed(speed.vertical, sensitivity),
        };

        let x, y;

        if (controlType === 'touch') {
          y = delta.horizontal;
          x = delta.vertical;
        }

        rotationX += x;
        if (rotationX > UP_DOWN_LIMIT) {
          rotationX = UP_DOWN_LIMIT;
        }
        if (rotationX < -UP_DOWN_LIMIT) {
          rotationX = -UP_DOWN_LIMIT;
        }
        rotationY += y;
        if (rotationY >= 360) {
          rotationY -= 360;
        } else if (y < 0) {
          y += 360
        }

        dispatch(rotate({
          x: rotationX,
          y: rotationY,
        }));
      }
    },
    onMouseUp(mouseEvent) {
      const { clientX: left, clientY: top } = mouseEvent;
      const {
        interactionDebounce,
        sensitivity,
      } = store.getState().scene;

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
        averageSpeed.x *= 500;
        averageSpeed.y *= 500;
        momentum.speed = {
          x: convertFromHorizontalSpeed(averageSpeed.x, sensitivity),
          y: convertFromVerticalSpeed(averageSpeed.y, sensitivity),
        };
        momentum.intervalId = setInterval(updateMomentum, 50);
      }
      interaction.active = false;
    }
  };
}

const Scene = connect(
  mapStateToProps,
  mapDisptachToProps,
)(Canvas);

export default Scene;
