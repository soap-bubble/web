import {
  Raycaster,
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
import backgroundFactory from './actions.background';
import introFactory from './actions.intro';
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
  let sceneToRender = scene3D;
  const render = () => {
    renderer.render(sceneToRender, camera);
  };
  renderEvents.onRender(render);
  renderEvents.onDestroy(() => {
    renderer.dispose();
  });
  return (newScene) => {
    sceneToRender = newScene;
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

export function canvasCreated(canvas) {
  return (dispatch, getState) => {
    if (canvas) {
      const titleActions = dispatch(titleActionsFactory());
      const buttonsActions = dispatch(buttonActionsFactory());
      const lightsActions = dispatch(lightActionsFactory());
      const backgroundActions = dispatch(backgroundFactory());
      const introActions = dispatch(introFactory({
        canvas,
      }));
      const { width, height } = titleDimensions(getState());
      const camera = createCamera({ width, height });
      const renderer = createRenderer({
        canvas,
        width,
        height,
        preserveDrawingBuffer: true,
      });
      positionCamera({
        camera,
        vector3: { z: 2 },
      });
      const scene3D = createScene();

      for (const object of backgroundActions.createObject3D()) {
        scene3D.add(object);
      }
      for (const object of lightsActions.createObject3D()) {
        scene3D.add(object);
      }
      for (const object of titleActions.createObject3D()) {
        scene3D.add(object);
      }
      for (const object of buttonsActions.createObject3D()) {
        scene3D.add(object);
      }
      for (const object of introActions.createObject3D()) {
        scene3D.add(object);
      }

      renderer.shadowMap.enabled = true;

      startRenderLoop({
        scene3D,
        camera,
        renderer,
      });

      const buttonCallback = ({
        name,
        screen,
      }) => {
        if (name === 'newButton') {
          introActions.activate(screen);
          dispatch(leaving());
          buttonsActions.stop();
          // setNewScene(dissolveActions.scene3D);
        }
      };

      titleActions.start();
      buttonsActions.start({
        camera,
        buttonCallback,
      });
      lightsActions.start();
      backgroundActions.start();

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

export function done() {
  return (dispatch) => {
    dispatch(gamestateActions.fetchInitial())
      .then(() => dispatch(sceneActions.startAtScene(2000)))
      .then(() => {
        dispatch({
          type: DONE,
        });
      });
  };
}
