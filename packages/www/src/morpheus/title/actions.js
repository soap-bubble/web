import { Scene } from "three";
import { createCamera, positionCamera, createRenderer } from "utils/three";
import renderEvents from "utils/render";
import { actions as sceneActions } from "morpheus/scene";
import { actions as gameActions } from "morpheus/game";
import titleActionsFactory from "./actions.title";
import buttonActionsFactory from "./actions.buttons";
import lightActionsFactory from "./actions.lights";
import backgroundFactory from "./actions.background";
import introFactory from "./actions.intro";
import { DONE, LEAVING, SET_RENDER_ELEMENTS, START } from "./actionTypes";

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

export function done() {
  return {
    type: DONE,
  };
}

export function canvasCreated(canvas, width, height, sizeStream) {
  return async (dispatch, getState) => {
    if (canvas) {
      const titleActions = dispatch(titleActionsFactory());
      const buttonsActions = dispatch(buttonActionsFactory(sizeStream, width, height));
      const lightsActions = dispatch(lightActionsFactory());
      const backgroundActions = dispatch(backgroundFactory());
      const introActions = dispatch(
        introFactory({
          canvas,
          hideRest() {
            titleActions.hide();
            buttonsActions.hide();
            lightsActions.hide();
            backgroundActions.hide();
          }
        }),
        
      );
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

      await buttonsActions.load();

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

      const buttonCallback = ({ name, screen }) => {
        if (name === "newButton") {
          delete localStorage.save;
          introActions.activate(screen);
          dispatch(leaving());
          buttonsActions.stop();
        } else if (name === "contButton") {
          const savedGame = dispatch(gameActions.browserLoad());
          if (savedGame) {
            dispatch(done());
            buttonsActions.stop();
          }
        } else if (name === "exitButton") {
          if (process.env.ELECTRON_ENV) {
            // TODO: ELECTRON
            // const remote = require('electron').remote;
            // const window = remote.getCurrentWindow();
            window.close();
          } else if (window.hasOwnProperty("cordova")) {
            navigator.app.exitApp();
          } else if (window.close) {
            window.close();
          }
        }
      };

      titleActions.start();
      buttonsActions.start({
        camera,
        buttonCallback,
      });
      lightsActions.start();
      backgroundActions.start();


      sizeStream.subscribe(({ width, height }) => {
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });
    }
  };
}

export function titleDone() {
  return (dispatch) => {
    dispatch(done());
  };
}
