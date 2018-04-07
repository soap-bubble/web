import {
  Scene,
} from 'three';
import {
  createCamera,
  positionCamera,
  createRenderer,
} from 'utils/three';
import renderEvents from 'utils/render';
import {
  actions as sceneActions,
} from 'morpheus/scene';
import {
  actions as gamestateActions,
} from 'morpheus/gamestate';
import {
  titleDimensions,
} from './selectors';
import titleActionsFactory from './actions.title';
import {
  DONE,
  MOUSE_CLICK,
  SET_RENDER_ELEMENTS,
  START,
} from './actionTypes';

function createScene({ object }) {
  const scene = new Scene();
  scene.add(object);
  return scene;
}

function startRenderLoop({ scene3D, camera, renderer }) {
  const render = () => {
    renderer.render(scene3D, camera);
  };
  renderEvents.onRender(render);
  renderEvents.onDestroy(() => {
    renderer.dispose();
  });
}

export function canvasCreated(canvas) {
  return (dispatch, getState) => {
    if (canvas) {
      const titleActions = dispatch(titleActionsFactory());
      const { width, height } = titleDimensions(getState());
      const camera = createCamera({ width, height });
      const renderer = createRenderer({ canvas, width, height });
      positionCamera({
        camera,
        vector3: { z: 2 },
      });
      const scene3D = createScene({
        object: titleActions.createObject3D(),
      });
      startRenderLoop({
        scene3D,
        camera,
        renderer,
      });
      titleActions.start();
      dispatch({
        type: SET_RENDER_ELEMENTS,
        payload: {
          camera,
          renderer,
        },
      });
    }
  };
}

export function mouseClick() {
  return {
    type: MOUSE_CLICK,
  };
}

export function start() {
  return {
    type: START,
  };
}

export function done() {
  return (dispatch) => {
    dispatch(gamestateActions.fetchInitial())
      .then(() => dispatch(sceneActions.startAtScene(100000)))
      .then(() => {
        dispatch({
          type: DONE,
        });
      });
  };
}
