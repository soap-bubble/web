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
import buttonActionsFactory from './actions.buttons';
import lightActionsFactory from './actions.lights';
import {
  DONE,
  LEAVING,
  SET_RENDER_ELEMENTS,
  START,
} from './actionTypes';

function createScene() {
  const scene = new Scene();
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
      const buttonsActions = dispatch(buttonActionsFactory());
      const lightsActions = dispatch(lightActionsFactory());
      const { width, height } = titleDimensions(getState());
      const camera = createCamera({ width, height });
      const renderer = createRenderer({ canvas, width, height });
      positionCamera({
        camera,
        vector3: { z: 2 },
      });
      const scene3D = createScene();

      for (const object of lightsActions.createObject3D()) {
        scene3D.add(object);
      }
      for (const object of titleActions.createObject3D()) {
        scene3D.add(object);
      }
      for (const object of buttonsActions.createObject3D()) {
        scene3D.add(object);
      }

      renderer.shadowMap.enabled = true;

      startRenderLoop({
        scene3D,
        camera,
        renderer,
      });

      titleActions.start();
      buttonsActions.start({
        camera,
      });
      lightsActions.start();

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

export function leaving() {
  return {
    type: LEAVING,
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
